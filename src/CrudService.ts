import { camelToSnakeCase, clearUndefined, parseJson } from '@nmxjs/utils';
import { FilterOperatorEnum, ListResponseDto } from '@nmxjs/types';
import {
  Raw,
  Not,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  In,
  FindOneOptions,
  FindManyOptions,
  FindOptionsWhere,
  IsNull,
} from 'typeorm';
import type { ICrudListOptions, IGetOneOptions } from './interfaces';
import type { ExtraRepository } from './ExtraRepository';
import { paginationLimit } from '@nmxjs/constants';
import { NotFoundError } from '@nmxjs/errors';

export class CrudService<E extends object, D extends object> {
  constructor(protected readonly repository: ExtraRepository<E, D>) {}

  public create = (payload: Partial<E>) =>
    this.repository
      .createQueryBuilder()
      .insert()
      .values(<any>clearUndefined(payload))
      .returning('*')
      .execute()
      .then(res => ({
        item: this.repository.entityToDto(res.raw[0]),
      }));

  public createMany = (payload: Partial<E>[]) =>
    this.repository
      .createQueryBuilder()
      .insert()
      .values(<any>payload.map(v => clearUndefined(v)))
      .returning('*')
      .execute()
      .then(res => ({
        items: <D[]>res.raw.map(v => this.repository.entityToDto(v)),
      }));

  public async update(idOrOptions: string | FindOptionsWhere<E> | FindOptionsWhere<E>[], payload: Partial<E>) {
    if (!idOrOptions || !Object.values(payload).length) {
      return {
        ok: false,
      };
    }

    const time: number = await this.repository
      .createQueryBuilder()
      .update()
      .where(
        typeof idOrOptions === 'string'
          ? {
              id: idOrOptions,
            }
          : idOrOptions,
      )
      .set(<any>clearUndefined(payload))
      .returning(['updated_at'])
      .execute()
      .then(res => res.raw[0]?.updated_at?.getTime());

    if (!time) {
      return {
        ok: false,
      };
    }

    return {
      ok: true,
      time,
    };
  }
  public async updateAndGet(idOrOptions: string | FindOptionsWhere<E> | FindOptionsWhere<E>[], payload: Partial<E>) {
    if (!idOrOptions || !Object.values(payload).length) {
      return {
        ok: false,
      };
    }

    const item = await this.repository
      .createQueryBuilder()
      .update()
      .where(
        typeof idOrOptions === 'string'
          ? {
              id: idOrOptions,
            }
          : idOrOptions,
      )
      .set(<any>clearUndefined(payload))
      .returning('*')
      .execute()
      .then(res => res.raw[0]);

    if (!item) {
      return {
        ok: false,
      };
    }

    return {
      ok: true,
      item: this.repository.entityToDto(item),
    };
  }

  public get = (options?: FindManyOptions<E>) =>
    this.repository.find(options).then(res => ({
      items: res.map((v): D => this.repository.entityToDto(v)),
    }));

  public async getOne(idOrOptions: string | IGetOneOptions<E>) {
    const result = await (!idOrOptions
      ? Promise.resolve({ item: <D>null })
      : this.repository.findOne(typeof idOrOptions === 'string' ? <FindOneOptions>{ where: { id: idOrOptions } } : idOrOptions).then(res => ({
          item: this.repository.entityToDto(res),
        })));

    if (!result.item && typeof idOrOptions !== 'string' && idOrOptions.reject) {
      throw new NotFoundError({
        entityName: this.repository.metadata.tableName,
      });
    }

    return result;
  }

  public delete = (idOrOptions: string | string[] | FindOptionsWhere<E> | FindOptionsWhere<E>[]) =>
    this.repository
      .createQueryBuilder()
      .delete()
      .where(
        typeof idOrOptions === 'string'
          ? { id: idOrOptions }
          : Array.isArray(idOrOptions) && typeof idOrOptions[0] === 'string'
          ? { id: In(<string[]>idOrOptions) }
          : idOrOptions,
      )
      .execute()
      .then(res => ({
        ok: res.affected > 0,
      }));

  public async list({ filters = [], pagination, sorts, ...options }: ICrudListOptions<E> = {}): Promise<ListResponseDto<D>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || paginationLimit;

    const findOptions: FindManyOptions<E> = {
      ...options,
      order: options.order || {},
      where: options.where || {},
      take: limit,
      skip: Math.round((page - 1) * limit),
    };

    let where = filters.reduce((res, v) => {
      const field = camelToSnakeCase(v.field);

      const value =
        parseJson({
          data: v.value,
          arrayValid: true,
        }) || v.value;

      if (value === 'null') {
        res[field] = v.not ? Not(IsNull()) : IsNull();
      } else if (v.operator === FilterOperatorEnum.EQ) {
        res[field] = value;
      } else if (v.operator === FilterOperatorEnum.IN) {
        res[field] = In(value);
      } else if (v.operator === FilterOperatorEnum.LESS) {
        res[field] = LessThan(value);
      } else if (v.operator === FilterOperatorEnum.LESS_OR_EQ) {
        res[field] = LessThanOrEqual(value);
      } else if (v.operator === FilterOperatorEnum.MORE) {
        res[field] = MoreThan(value);
      } else if (v.operator === FilterOperatorEnum.MORE_OR_EQ) {
        res[field] = MoreThanOrEqual(value);
      } else if (v.operator === FilterOperatorEnum.SEARCH) {
        res[field] = Raw(alias => `LOWER(${alias})${v.not ? 'NOT' : ''} LIKE :value`, {
          value: `${value}%`.toLowerCase(),
        });
      }

      if (v.not && v.operator !== FilterOperatorEnum.SEARCH && value !== 'null') {
        res[field] = Not(res[v.field]);
      }

      return res;
    }, {});

    sorts?.forEach(v => {
      findOptions.order[camelToSnakeCase(v.field)] = v.type;
    });

    if (Array.isArray(findOptions.where)) {
      findOptions.where = [...(Object.keys(where).length ? [where] : []), ...findOptions.where];
    } else if (findOptions.where) {
      findOptions.where = {
        ...where,
        ...findOptions.where,
      };
    }

    const [totalCount, items] = await Promise.all([
      this.repository.count(findOptions),
      this.repository.find(findOptions).then(res => res.map(v => this.repository.entityToDto(v))),
    ]);
    const nextPage = page + 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      cursor: {
        totalCount,
        totalPages,
        ...(nextPage && nextPage <= totalPages ? { nextPage } : {}),
      },
    };
  }
}
