import { ListRequestDto } from '@nmxjs/types';

export interface IRepositoryListOptions<T extends object> extends ListRequestDto {
  relations?: Array<keyof T>;
}
