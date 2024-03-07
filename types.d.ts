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
    LIKE,
  }
}
