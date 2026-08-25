import { camelToSnakeCase, clearUndefined, parseJson } from '@nmxjs/utils';
import { ListResponseDto } from '@nmxjs/types';
import { Logger } from '@nestjs/common';
import { And, In, FindOneOptions, FindManyOptions, FindOptionsWhere } from 'typeorm';
import type { ICrudListOptions, IGetOneOptions } from './interfaces';
import type { ExtraRepository } from './ExtraRepository';
import { paginationLimit } from '@nmxjs/constants';
import { NotFoundError } from '@nmxjs/errors';
import { isValidUUID } from './isValidUUID';
import { getFilterCondition } from './getFilterCondition';
import { toFindOperator } from './toFindOperator';
import { isEmptyCondition } from './isEmptyCondition';

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
    if (process.env.DEBUG === 'true') {
      Logger.debug(`CrudService.update table=${this.repository.metadata.tableName} id=${JSON.stringify(idOrOptions)}`);
    }

    if (isEmptyCondition(idOrOptions)) {
      return {
        ok: false,
      };
    }

    const values = clearUndefined(payload || {});

    if (!Object.keys(values).length) {
      return {
        ok: false,
      };
    }

    if (typeof idOrOptions === 'string' && !isValidUUID(idOrOptions)) {
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
      .set(<any>values)
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
    if (process.env.DEBUG === 'true') {
      Logger.debug(`CrudService.updateAndGet table=${this.repository.metadata.tableName} id=${JSON.stringify(idOrOptions)}`);
    }

    if (isEmptyCondition(idOrOptions)) {
      return {
        ok: false,
      };
    }

    const values = clearUndefined(payload || {});

    if (!Object.keys(values).length) {
      return {
        ok: false,
      };
    }

    if (typeof idOrOptions === 'string' && !isValidUUID(idOrOptions)) {
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
      .set(<any>values)
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

  public async getOne(idOrOptions: string | IGetOneOptions<E, D>) {
    if (process.env.DEBUG === 'true') {
      Logger.debug(`CrudService.getOne table=${this.repository.metadata.tableName} id=${JSON.stringify(idOrOptions)}`);
    }

    if (typeof idOrOptions === 'string' && !isValidUUID(idOrOptions)) {
      return {
        item: <D>null,
      };
    }

    const hasCondition = typeof idOrOptions === 'string' ? !!idOrOptions : !isEmptyCondition(idOrOptions?.where);

    const result = await (!hasCondition
      ? Promise.resolve({ item: <D>null })
      : this.repository
          .findOne(
            typeof idOrOptions === 'string'
              ? <FindOneOptions>{ where: { id: idOrOptions } }
              : (() => {
                  const { dtoSelect, ...options } = idOrOptions;
                  return {
                    ...options,
                    ...(dtoSelect?.length ? { select: dtoSelect.map((v: any): any => camelToSnakeCase(v)) } : {}),
                  };
                })(),
          )
          .then(res => ({
            item: this.repository.entityToDto(res),
          })));

    if (!result.item && typeof idOrOptions !== 'string' && idOrOptions?.reject) {
      throw new NotFoundError({
        entityName: this.repository.metadata.tableName,
      });
    }

    return result;
  }

  public delete = (idOrOptions: string | string[] | FindOptionsWhere<E> | FindOptionsWhere<E>[]) => {
    if (isEmptyCondition(idOrOptions)) {
      return Promise.resolve({ ok: false });
    }

    if (typeof idOrOptions === 'string' && !isValidUUID(idOrOptions)) {
      return Promise.resolve({ ok: false });
    }

    if (Array.isArray(idOrOptions) && typeof idOrOptions[0] === 'string' && idOrOptions.some(v => typeof v === 'string' && !isValidUUID(v))) {
      return Promise.resolve({ ok: false });
    }

    return this.repository
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
  };

  public async list({ filters = [], pagination, sorts, ...options }: ICrudListOptions<E> = {}): Promise<ListResponseDto<D>> {
    const page = pagination?.page || 1;

    if (process.env.DEBUG === 'true') {
      Logger.debug(`CrudService.list table=${this.repository.metadata.tableName} page=${page} filters=${filters.length}`);
    }
    const limit = pagination?.limit || paginationLimit;

    const findOptions: FindManyOptions<E> = {
      ...options,
      order: options.order || {},
      where: options.where || {},
      take: limit,
      skip: Math.round((page - 1) * limit),
    };

    let where = filters.reduce((res, v, index) => {
      const field = camelToSnakeCase(v.field);

      const value =
        typeof v.value !== 'string'
          ? v.value
          : parseJson({
              data: v.value,
              arrayValid: true,
            }) || v.value;

      const condition = getFilterCondition({
        field,
        index,
        operator: v.operator,
        not: v.not,
        value,
        rawValue: v.value,
      });

      if (condition !== undefined) {
        res[field] = Object.prototype.hasOwnProperty.call(res, field)
          ? And(toFindOperator(res[field]), toFindOperator(condition))
          : condition;
      }

      return res;
    }, {});

    sorts?.forEach(v => {
      findOptions.order[camelToSnakeCase(v.field)] = v.type;
    });

    if (Array.isArray(findOptions.where)) {
      findOptions.where = findOptions.where.length ? findOptions.where.map(v => ({ ...where, ...v })) : where;
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
