import { ICallback } from '@nmxjs/types';

export interface IGetGraphQlModuleUseFactoryResult {
  origin?: string;
  resolvers?: Record<string, any>;
  onSubscriptionConnect?: ICallback<Record<string, string>>;
  onSubscriptionDisconnect?: ICallback<Record<string, string>>;
}
