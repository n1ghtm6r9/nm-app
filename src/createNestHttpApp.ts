import helmet from 'helmet';
import * as compression from 'compression';
import { getEnvironment } from '@nmxjs/utils';
import { EnvironmentEnum } from '@nmxjs/types';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ICreateNestAppOptions } from './interfaces';

export async function createNestHttpApp({ service, module }: ICreateNestAppOptions) {
  const app = await NestFactory.create(module);

  if (getEnvironment() === EnvironmentEnum.PRODUCTION) {
    app.use(helmet());
  }

  app.use(compression());
  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`Http service ${service} started on port "${port}"!`);
}
