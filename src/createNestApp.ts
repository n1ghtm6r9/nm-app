import { configKey, IConfig } from '@nmxjs/config';
import { RpcExceptionInterceptor, getTransporterOptionsKey, GetTransporterOptions } from '@nmxjs/api';
import { eventsClientKey, IEventsClient } from '@nmxjs/events';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { INestApplication, Logger } from '@nestjs/common';
import { isWorkerApp } from '@nmxjs/utils';
import { ICreateNestAppOptions } from './interfaces';

export async function createNestApp({ service, module }: ICreateNestAppOptions) {
  const isWorker = isWorkerApp();
  const app = <INestApplication>await NestFactory[isWorker ? 'createApplicationContext' : 'create'](module);

  if (!isWorker) {
    app.useGlobalInterceptors(new RpcExceptionInterceptor());
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
  } else {
    await app.init();
  }

  Logger.log(`Microservice "${service}${process.env.BOOT_MODE ? `-${process.env.BOOT_MODE}` : ''}" started!`);
}
