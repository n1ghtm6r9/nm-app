import { FilterOperatorEnum } from '@nmxjs/types';
import { Raw, Not, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, In, IsNull } from 'typeorm';
import type { IGetFilterConditionOptions } from './interfaces';
import { escapeLike } from './escapeLike';

export const getFilterCondition = ({ field, index, operator, not, value, rawValue }: IGetFilterConditionOptions) => {
  if (operator === FilterOperatorEnum.SEARCH) {
    if (rawValue === undefined || rawValue === null) {
      return undefined;
    }

    const param = `search_${field.replace(/\W/g, '_')}_${index}`;

    return Raw(alias => `(${alias})::text ${not ? 'NOT ' : ''}ILIKE :${param}`, {
      [param]: `%${escapeLike(String(rawValue))}%`,
    });
  }

  if (value === null || value === 'null') {
    return not ? Not(IsNull()) : IsNull();
  }

  let condition;

  if (operator === FilterOperatorEnum.EQ) {
    condition = value;
  } else if (operator === FilterOperatorEnum.IN) {
    condition = In(Array.isArray(value) ? value : [value]);
  } else if (operator === FilterOperatorEnum.LESS) {
    condition = LessThan(value);
  } else if (operator === FilterOperatorEnum.LESS_OR_EQ) {
    condition = LessThanOrEqual(value);
  } else if (operator === FilterOperatorEnum.MORE) {
    condition = MoreThan(value);
  } else if (operator === FilterOperatorEnum.MORE_OR_EQ) {
    condition = MoreThanOrEqual(value);
  }

  if (condition === undefined) {
    return undefined;
  }

  return not ? Not(condition) : condition;
};
