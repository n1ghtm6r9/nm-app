import helmet from 'helmet';
import * as compression from 'compression';
import { getEnvironment } from '@nmxjs/utils';
import { EnvironmentEnum } from '@nmxjs/types';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ICreateNestAppOptions } from './interfaces';
import { configKey, IConfig } from '@nmxjs/config';
import { eventsClientKey, IEventsClient } from '@nmxjs/events';

export async function createNestHttpApp({ service, module }: ICreateNestAppOptions) {
  const app = await NestFactory.create(module);

  if (getEnvironment() === EnvironmentEnum.PRODUCTION) {
    app.use(helmet());
  }

  app.use(compression());
  const port = process.env.PORT || 3000;
  await app.listen(port);

  const config = app.get<IConfig>(configKey);
  const eventsOptions = config.event ? app.get<IEventsClient>(eventsClientKey).options : null;

  if (eventsOptions) {
    await app.connectMicroservice(eventsOptions).listen();
  }

  Logger.log(`Http service ${service} started on port "${port}"!`);
}
