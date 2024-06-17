import { FindOneOptions } from 'typeorm';

export interface IGetOneOptions<E extends object> extends FindOneOptions<E> {
  reject?: boolean;
}
