import { ICallback } from '@nmxjs/types';

export interface IGetGraphQlModuleOptions {
  onSubscriptionConnect?: ICallback<Record<string, string>>;
  onSubscriptionDisconnect?: ICallback<Record<string, string>>;
}
