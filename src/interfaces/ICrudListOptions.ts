import { ListRequestDto } from '@nmxjs/types';
import { FindOptionsWhere } from 'typeorm';

export interface ICrudListOptions<E extends object> extends ListRequestDto {
  relations?: Array<keyof E>;
  where?: FindOptionsWhere<E> | FindOptionsWhere<E>[];
}
