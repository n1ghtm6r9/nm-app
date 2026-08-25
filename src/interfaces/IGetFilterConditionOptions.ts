import { FilterOperatorEnum } from '@nmxjs/types';

export interface IGetFilterConditionOptions {
  field: string;
  index: number;
  operator?: FilterOperatorEnum;
  not?: boolean;
  value: any;
  rawValue: any;
}
