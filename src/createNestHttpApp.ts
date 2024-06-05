import helmet from 'helmet';
import * as compression from 'compression';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { getEnvironment, parseJson } from '@nmxjs/utils';
import { EnvironmentEnum } from '@nmxjs/types';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ICreateNestAppOptions } from './interfaces';
import { configKey, IConfig } from '@nmxjs/config';
import { eventsClientKey, IEventsClient } from '@nmxjs/events';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GqlExceptionFilter } from './GqlExceptionFilter';

export async function createNestHttpApp({ service, module }: ICreateNestAppOptions) {
  const app = await NestFactory.create(module);

  if (getEnvironment() === EnvironmentEnum.PRODUCTION) {
    app.use(helmet());
  }

  app.use(compression());
  app.use(graphqlUploadExpress());

  const port = process.env.PORT || 3000;

  app.enableCors({
    origin:
      parseJson({
        data: process.env.ORIGINS,
        arrayValid: true,
      }) || '*',
    credentials: true,
  });

  app.useGlobalFilters(new GqlExceptionFilter());

  await app.listen(port);

  const config = app.get<IConfig>(configKey);
  const eventsOptions = config.event ? app.get<IEventsClient>(eventsClientKey).options : null;

  if (eventsOptions) {
    await app.connectMicroservice<MicroserviceOptions>(eventsOptions).listen();
  }

  Logger.log(`Http service ${service} started on port "${port}"!`);
}
