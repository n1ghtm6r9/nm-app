import { Equal, FindOperator } from 'typeorm';

export const toFindOperator = <T>(condition: T | FindOperator<T>): FindOperator<T> =>
  condition instanceof FindOperator ? condition : Equal(<T>condition);
