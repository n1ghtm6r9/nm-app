declare module '@nestjs/microservices' {
  class ClientsModule {
    static register(data);
  }

  interface MicroserviceOptions {}

  enum Transport {
    TCP,
  }
}

declare module '@nestjs/common' {
  interface INestApplication {
    get<T>(data);
    connectMicroservice<T>(first, second);
    [key: string]: any;
  }

  class Logger {
    static log(str);
  }

  class ModuleMetadata {
    imports: any[];
  }

  interface ExceptionFilter {}

  const Catch = (): ClassDecorator => {};

  class NotFoundException {
    message: string;
  }

  class DynamicModule {}
}

declare module '@nestjs/typeorm' {
  class TypeOrmModule {
    static forRootAsync: any;
  }

  type TypeOrmModuleOptions = {};
}

declare module '@nestjs/core' {
  class NestFactory {}
}

declare module '@nestjs/testing' {
  class Test {
    static createTestingModule(options: { imports: any[] }): any;
  }
}
declare module '@graphql-tools/utils' {
  const pruneSchema: any;
}

declare module '@nmxjs/config' {
  interface IConfig {
    event?: any;
    db?: {
      type: any;
      host: string;
      port: number;
      username?: string;
      password?: string;
      database?: string;
      options?: Record<string, any>;
    };
  }
  const configKey: string;
}

declare module '@nmxjs/api' {
  const RpcExceptionInterceptor: any;
  const getTransporterOptionsKey: string;
  type GetTransporterOptions = (
    serviceName: string,
  ) => Exclude<import('@nestjs/microservices').MicroserviceOptions, import('@nestjs/microservices').CustomStrategy>;
}

declare module '@nmxjs/events' {
  const eventsClientKey: string;
  interface IEventsClient {
    options: Exclude<import('@nestjs/microservices').MicroserviceOptions, import('@nestjs/microservices').CustomStrategy>;
  }
}

declare module '@nmxjs/types' {
  type ICallback<T> = any;
  type ListResponseDto<T> = any;
  type ListRequestDto = any;
  enum EnvironmentEnum {
    PRODUCTION,
  }
  enum FilterOperatorEnum {
    EQ,
    IN,
    LESS,
    LESS_OR_EQ,
    MORE,
    MORE_OR_EQ,
    SEARCH,
  }
}
