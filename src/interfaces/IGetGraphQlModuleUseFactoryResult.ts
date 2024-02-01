import { ICallback } from '@nmxjs/types';

export interface IGetGraphQlModuleUseFactoryResult {
  resolvers?: Record<string, any>;
  onSubscriptionConnect?: ICallback<Record<string, string>>;
  onSubscriptionDisconnect?: ICallback<Record<string, string>>;
}
