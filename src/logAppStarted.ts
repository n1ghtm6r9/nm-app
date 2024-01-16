import { Logger } from '@nestjs/common';

export const logAppStarted = (service: string) =>
  Logger.log(`Microservice "${service}${process.env.BOOT_MODE ? `-${process.env.BOOT_MODE}` : ''}" started!`);
