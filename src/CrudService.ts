import { camelToSnakeCase, clearUndefined } from '@nmxjs/utils';
import { FilterOperatorEnum, ListResponseDto } from '@nmxjs/types';
import { Not, Like, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, In, FindOneOptions, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { ICrudListOptions, ICrudUpdateOptions } from './interfaces';
import type { ExtraRepository } from './ExtraRepository';

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

  public async update({ id, payload }: ICrudUpdateOptions<E>) {
    if (!Object.values(payload).length) {
      return {
        ok: false,
      };
    }

    const ok = await this.repository
      .createQueryBuilder()
      .update()
      .where({
        id,
      })
      .set(<any>clearUndefined(payload))
      .execute()
      .then(res => res.affected > 0);

    return {
      ok,
    };
  }

  public get = (options?: FindManyOptions<E>) =>
    this.repository.find(options).then(res => ({
      items: res.map(v => this.repository.entityToDto.call(v)),
    }));

  public getOne = (idOrOptions: string | FindOneOptions<E>) =>
    this.repository.findOne(typeof idOrOptions === 'string' ? <FindOneOptions>{ where: { id: idOrOptions } } : idOrOptions).then(res => ({
      item: this.repository.entityToDto(res),
    }));

  public delete = (idsOrOptions: string[] | FindOptionsWhere<E>) =>
    this.repository
      .createQueryBuilder()
      .where(Array.isArray(idsOrOptions) ? { id: In(idsOrOptions) } : idsOrOptions)
      .execute()
      .then(res => ({
        ok: res.affected > 0,
      }));

  public async list(options: ICrudListOptions<E>): Promise<ListResponseDto<D>> {
    const filters = options.filters || [];
    const relations = options.relations || [];
    const builder = this.repository.createQueryBuilder(this.repository.metadata.tableName);
    const hasPagination = Boolean(options.pagination?.limit && options.pagination?.page);

    if (options.pagination?.limit) {
      builder.limit(options.pagination.limit);
    }

    if (hasPagination) {
      builder.offset((options.pagination.page - 1) * options.pagination.limit);
    }

    relations.forEach(v => {
      builder.leftJoinAndSelect(`${this.repository.metadata.tableName}.${<string>v}`, <string>v);
    });

    const where = filters.reduce((res, v) => {
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

    options.sorts?.forEach((v, i) => {
      if (i === 0) {
        builder.orderBy(v.field, v.type);
      } else {
        builder.addOrderBy(v.field, v.type);
      }
    });

    const [totalCount, items] = await Promise.all([
      this.repository.createQueryBuilder().where(where).getCount(),
      builder
        .where(where)
        .select('*')
        .execute()
        .then(res => res.map(v => this.repository.entityToDto(v))),
    ]);
    const totalPages = hasPagination ? Math.ceil(totalCount / options.pagination.limit) : 1;
    const nextPage = hasPagination ? options.pagination.page + 1 : undefined;

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
