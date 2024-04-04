import { ListRequestDto } from '@nmxjs/types';
import { FindManyOptions } from 'typeorm';

export interface ICrudListOptions<E extends object> extends ListRequestDto, FindManyOptions<E> {}
