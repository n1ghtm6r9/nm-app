import { configKey, IConfig } from '@nmxjs/config';
import { RpcExceptionInterceptor, getTransporterOptionsKey, GetTransporterOptions } from '@nmxjs/api';
import { eventsClientKey, IEventsClient } from '@nmxjs/events';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { INestApplication } from '@nestjs/common';
import { isWorkerApp } from '@nmxjs/utils';
import { ICreateNestAppOptions } from './interfaces';
import { logAppStarted } from './logAppStarted';

export async function createNestApp({ service, module }: ICreateNestAppOptions) {
  const isWorker = isWorkerApp();
  const app = <INestApplication>await NestFactory[isWorker ? 'createApplicationContext' : 'create'](module);

  if (isWorker) {
    await app.init();
    return logAppStarted(service);
  }

  if (process.env.DEBUG === 'true') {
    app.useGlobalInterceptors(new RpcExceptionInterceptor());
  }

  const config = app.get<IConfig>(configKey);
  const eventsOptions = config.event ? app.get<IEventsClient>(eventsClientKey).options : null;
  const transporterOptions = app.get<GetTransporterOptions>(getTransporterOptionsKey)(service);

  const microserviceApps = [
    app.connectMicroservice<MicroserviceOptions>(transporterOptions, { inheritAppConfig: true }),
    ...(eventsOptions && eventsOptions.transport !== transporterOptions.transport
      ? [app.connectMicroservice<MicroserviceOptions>(eventsOptions, { inheritAppConfig: true })]
      : []),
  ];

  await app.init();
  await Promise.all(microserviceApps.map(microserviceApp => microserviceApp.listen()));
  logAppStarted(service);
}
