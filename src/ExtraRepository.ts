import { FilterOperatorEnum, ListRequestDto, ListResponseDto } from '@nmxjs/types';
import { DataSource, Repository, Not, Like, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, EntityTarget, In } from 'typeorm';

export class ExtraRepository<T> extends Repository<T> {
  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }

  public async list(options: ListRequestDto): Promise<ListResponseDto<T>> {
    const filters = options.filters || [];
    const builder = this.createQueryBuilder();
    const hasPagination = Boolean(options.pagination?.limit && options.pagination?.page);

    if (options.pagination?.limit) {
      builder.limit(options.pagination.limit);
    }

    if (hasPagination) {
      builder.offset((options.pagination.page - 1) * options.pagination.limit);
    }

    const where = filters.reduce((res, v) => {
      if (v.operator === FilterOperatorEnum.EQ) {
        res[v.field] = v.values[0];
      } else if (v.operator === FilterOperatorEnum.IN) {
        res[v.field] = In(v.values);
      } else if (v.operator === FilterOperatorEnum.LESS) {
        res[v.field] = LessThan(v.values[0]);
      } else if (v.operator === FilterOperatorEnum.LESS_OR_EQ) {
        res[v.field] = LessThanOrEqual(v.values[0]);
      } else if (v.operator === FilterOperatorEnum.MORE) {
        res[v.field] = MoreThan(v.values[0]);
      } else if (v.operator === FilterOperatorEnum.MORE_OR_EQ) {
        res[v.field] = MoreThanOrEqual(v.values[0]);
      } else if (v.operator === FilterOperatorEnum.LIKE) {
        res[v.field] = Like(v.values[0]);
      }

      if (v.not) {
        res[v.field] = Not(res[v.field]);
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

    const [totalCount, items] = await Promise.all([this.createQueryBuilder().where(where).getCount(), builder.where(where).select('*').execute()]);
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
