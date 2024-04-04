import { camelToSnakeCase, clearUndefined } from '@nmxjs/utils';
import { FilterOperatorEnum, ListResponseDto } from '@nmxjs/types';
import { Not, Like, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, In, FindOneOptions, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { ICrudListOptions } from './interfaces';
import type { ExtraRepository } from './ExtraRepository';
import { paginationLimit } from '@nmxjs/constants';

export class CrudService<E extends object, D extends object> {
  constructor(protected readonly repository: ExtraRepository<E, D>) {}

  public create = (payload: Partial<E>) =>
    this.repository
      .createQueryBuilder()
      .insert()
      .values(<any>clearUndefined(payload))
      .returning(['id'])
      .execute()
      .then(res => ({
        id: <string>res.raw[0].id,
      }));

  public createMany = (payload: Partial<E>[]) =>
    this.repository
      .createQueryBuilder()
      .insert()
      .values(<any>payload.map(v => clearUndefined(v)))
      .returning(['id'])
      .execute()
      .then(res => ({
        ids: <string[]>res.raw.map(v => v.id),
      }));

  public async update(idOrOptions: string | FindOptionsWhere<E> | FindOptionsWhere<E>[], payload: Partial<E>) {
    if (!idOrOptions || !Object.values(payload).length) {
      return {
        ok: false,
      };
    }

    const ok = await this.repository
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
      .execute()
      .then(res => res.affected > 0);

    return {
      ok,
    };
  }

  public get = (options?: FindManyOptions<E>) =>
    this.repository.find(options).then(res => ({
      items: res.map((v): D => this.repository.entityToDto(v)),
    }));

  public getOne = (idOrOptions: string | FindOneOptions<E>) =>
    !idOrOptions
      ? Promise.resolve({ item: <D>null })
      : this.repository.findOne(typeof idOrOptions === 'string' ? <FindOneOptions>{ where: { id: idOrOptions } } : idOrOptions).then(res => ({
          item: this.repository.entityToDto(res),
        }));

  public delete = (idsOrOptions: string[] | FindOptionsWhere<E> | FindOptionsWhere<E>[]) =>
    this.repository
      .createQueryBuilder()
      .delete()
      .where(Array.isArray(idsOrOptions) && typeof idsOrOptions[0] === 'string' ? { id: In(<string[]>idsOrOptions) } : idsOrOptions)
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

      if (v.operator === FilterOperatorEnum.EQ) {
        res[field] = v.values[0];
      } else if (v.operator === FilterOperatorEnum.IN) {
        res[field] = In(v.values);
      } else if (v.operator === FilterOperatorEnum.LESS) {
        res[field] = LessThan(v.values[0]);
      } else if (v.operator === FilterOperatorEnum.LESS_OR_EQ) {
        res[field] = LessThanOrEqual(v.values[0]);
      } else if (v.operator === FilterOperatorEnum.MORE) {
        res[field] = MoreThan(v.values[0]);
      } else if (v.operator === FilterOperatorEnum.MORE_OR_EQ) {
        res[field] = MoreThanOrEqual(v.values[0]);
      } else if (v.operator === FilterOperatorEnum.LIKE) {
        res[field] = Like(v.values[0]);
      }

      if (v.not) {
        res[field] = Not(res[v.field]);
      }

      return res;
    }, {});

    options.sorts?.forEach(v => {
      findOptions.order[v.field] = v.type;
    });

    if (Array.isArray(findOptions.where)) {
      findOptions.where = [...(Object.keys(where).length ? [where] : []), ...findOptions.where];
    } else if (options.where) {
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
        ...(nextPage && nextPage < totalPages ? { nextPage } : {}),
      },
    };
  }
}
