import { ICallback } from '@nmxjs/types';

export interface IGetGraphQlModuleUseFactoryResult {
  resolvers?: Record<string, any>;
  onSubscriptionConnect?: ICallback<Record<string, any>>;
  onSubscriptionDisconnect?: ICallback<Record<string, any>>;
}
