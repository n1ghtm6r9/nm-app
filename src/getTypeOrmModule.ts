import { DataSource } from 'typeorm';
import { getEnvironment } from '@nmxjs/utils';
import { EnvironmentEnum } from '@nmxjs/types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IConfig, configKey } from '@nmxjs/config';

export const getTypeOrmModule = () =>
  TypeOrmModule.forRootAsync({
    useFactory: (config: IConfig) => {
      const options = {
        type: config.db.type,
        host: config.db.host,
        port: config.db.port,
        username: config.db.username,
        password: config.db.password,
        database: config.db.database,
        synchronize: true,
        autoLoadEntities: true,
        ...(config.db.options ? config.db.options : {}),
      };
      return getEnvironment() !== EnvironmentEnum.PRODUCTION && options.database
        ? new DataSource({
            type: options.type,
            host: options.host,
            port: options.port,
            username: options.username,
            password: options.password,
          })
            .initialize()
            .then(ds =>
              ds
                .query(`CREATE DATABASE "${options.database}"`)
                .then(() => ds)
                .catch(() => ds),
            )
            .then(ds => ds.destroy())
            .then(() => options)
        : options;
    },
    inject: [configKey],
  });
