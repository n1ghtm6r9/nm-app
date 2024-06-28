import { FindOneOptions } from 'typeorm';

export interface IGetOneOptions<E extends object, D extends object> extends FindOneOptions<E> {
  reject?: boolean;
  dtoSelect?: Array<keyof D>;
}
