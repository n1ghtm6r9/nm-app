import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { IConfig, configKey } from '@nmxjs/config';

export const getTypeOrmModule = (options?: Partial<TypeOrmModuleOptions>) =>
  TypeOrmModule.forRootAsync({
    useFactory: (config: IConfig) => ({
      type: config.db.type,
      host: config.db.host,
      port: config.db.port,
      username: config.db.username,
      password: config.db.password,
      database: config.db.database,
      synchronize: true,
      autoLoadEntities: true,
      ...(config.db.options ? config.db.options : {}),
      ...(options ? <any>options : {}),
    }),
    inject: [configKey],
  });
