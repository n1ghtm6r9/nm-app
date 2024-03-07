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
  enum FilterOperatorEnum {
    EQ = 'EQ',
    IN = 'IN',
    LIKE = 'LIKE',
    LESS = 'LESS',
    LESS_OR_EQ = 'LESS_OR_EQ',
    MORE = 'MORE',
    MORE_OR_EQ = 'MORE_OR_EQ',
  }
  enum EnvironmentEnum {
    PRODUCTION = 'PRODUCTION,',
  }
  type ICallback<T> = any;
  type ListRequestDto = any;
  type ListResponseDto<T> = any;
}
