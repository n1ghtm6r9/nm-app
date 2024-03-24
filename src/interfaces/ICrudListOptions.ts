import { ListRequestDto } from '@nmxjs/types';

export interface ICrudListOptions<T extends object> extends ListRequestDto {
  relations?: Array<keyof T>;
}
