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
