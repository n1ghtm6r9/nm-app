import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { IConfig, configKey } from '@nmxjs/config';
import { ensureDatabase } from './ensureDatabase';

export const getTypeOrmModule = (options?: Partial<TypeOrmModuleOptions>) =>
  TypeOrmModule.forRootAsync({
    useFactory: async (config: IConfig) => {
      if (config.db?.type === 'postgres') {
        await ensureDatabase(config.db);
      }

      return {
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
      };
    },
    inject: [configKey],
  });
