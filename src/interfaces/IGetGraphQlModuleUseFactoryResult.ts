import { ICallback } from '@nmxjs/types';

export interface IGetGraphQlModuleUseFactoryResult {
  origin?: string;
  onSubscriptionConnect?: ICallback<Record<string, string>>;
  onSubscriptionDisconnect?: ICallback<Record<string, string>>;
}
