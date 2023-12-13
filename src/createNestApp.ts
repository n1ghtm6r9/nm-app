import { RpcExceptionInterceptor, getGrpcOptionsKey, GetGrpcOptions } from '@nmxjs/api';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { INestApplication, Logger } from '@nestjs/common';
import { isWorkerApp } from '@nmxjs/utils';

export async function createNestApp(serviceName: string, module: any) {
  const isWorker = isWorkerApp();
  const app = <INestApplication>await NestFactory[isWorker ? 'createApplicationContext' : 'create'](module);

  if (!isWorker) {
    app.useGlobalInterceptors(new RpcExceptionInterceptor());
    const getGrpcOptions: GetGrpcOptions = app.get(getGrpcOptionsKey);

    const microserviceApps = [app.connectMicroservice<MicroserviceOptions>(getGrpcOptions(serviceName), { inheritAppConfig: true })];
    await app.init();
    await Promise.all(microserviceApps.map(microserviceApp => microserviceApp.listen()));
  } else {
    await app.init();
  }

  Logger.log(`Microservice "${serviceName}${process.env.BOOT_MODE ? `-${process.env.BOOT_MODE}` : ''}" started!`);
}
