import { ListRequestDto } from '@nmxjs/types';
import { FindOptionsRelations, FindOptionsWhere } from 'typeorm';

export interface ICrudListOptions<E extends object> extends ListRequestDto {
  relations?: FindOptionsRelations<E>;
  where?: FindOptionsWhere<E> | FindOptionsWhere<E>[];
}
