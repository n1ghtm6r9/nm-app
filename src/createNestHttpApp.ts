import helmet from 'helmet';
import * as compression from 'compression';
import { getEnvironment } from '@nmxjs/utils';
import { EnvironmentEnum } from '@nmxjs/types';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

export async function createNestHttpApp(serviceName: string, module: any) {
  const app = await NestFactory.create(module);

  if (getEnvironment() === EnvironmentEnum.PRODUCTION) {
    app.use(helmet());
  }

  app.use(compression());
  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`Http service ${serviceName} started on port "${port}"!`);
}
