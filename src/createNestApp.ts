import helmet from 'helmet';
import * as compression from 'compression';
import { EnvironmentEnum } from '@nmxjs/types';
import { configKey, IConfig } from '@nmxjs/config';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { RpcExceptionInterceptor, getTransporterOptionsKey, GetTransporterOptions } from '@nmxjs/api';
import { eventsClientKey, IEventsClient } from '@nmxjs/events';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { INestApplication, Logger } from '@nestjs/common';
import { isWorkerApp, getEnvironment, parseJson } from '@nmxjs/utils';
import { ICreateNestAppOptions } from './interfaces';
import { logAppStarted } from './logAppStarted';
import { GqlExceptionFilter } from './GqlExceptionFilter';
import { checkIsGraphQlModuleExits } from './getGraphQlModule';
import { notifierKey, isNotifierEnabled } from '@nmxjs/notifications';
import { nestAppStartedKey } from '@nmxjs/constants';

export async function createNestApp({ service, module, http }: ICreateNestAppOptions) {
  const isWorker = isWorkerApp();
  const app = <INestApplication>await NestFactory[isWorker ? 'createApplicationContext' : 'create'](module);

  if (isWorker) {
    await app.init();
    return logAppStarted(service);
  }

  if (http && getEnvironment() === EnvironmentEnum.PRODUCTION) {
    app.use(helmet());
  }

  const port = process.env.PORT || 3000;
  const notifier = isNotifierEnabled() ? app.get(notifierKey) : null;
  app.useGlobalInterceptors(new RpcExceptionInterceptor(service, process.env.DEBUG === 'true', notifier));

  const config = app.get<IConfig>(configKey);
  const eventsOptions = config.event ? app.get<IEventsClient>(eventsClientKey).options : null;
  const transporterOptions = app.get<GetTransporterOptions>(getTransporterOptionsKey)(service);

  const microserviceApps = [
    ...(transporterOptions ? [app.connectMicroservice<MicroserviceOptions>(transporterOptions, { inheritAppConfig: true })] : []),
    ...(eventsOptions && transporterOptions && eventsOptions.transport !== transporterOptions.transport
      ? [app.connectMicroservice<MicroserviceOptions>(eventsOptions, { inheritAppConfig: true })]
      : []),
  ];

  if (http) {
    app.use(compression());
    app.use(graphqlUploadExpress());
    app.enableCors({
      origin:
        parseJson({
          data: process.env.ORIGINS,
          arrayValid: true,
        }) || '*',
      credentials: true,
    });

    if (checkIsGraphQlModuleExits()) {
      app.useGlobalFilters(new GqlExceptionFilter(service, notifier));
    }

    await app.listen(port);
    Logger.log(`Http service ${service} started on port "${port}"!`);
  } else {
    await app.init();
  }

  await Promise.all(microserviceApps.map(microserviceApp => microserviceApp.listen()));

  if (microserviceApps.length > 0) {
    logAppStarted(service);
  }

  process.env[nestAppStartedKey] = 'true';
}
