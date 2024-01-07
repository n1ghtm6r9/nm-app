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
