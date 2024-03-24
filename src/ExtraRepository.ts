import { DataSource, Repository, EntityTarget } from 'typeorm';
import { CrudService } from './CrudService';

export abstract class ExtraRepository<E extends object, D extends object> extends Repository<E> {
  public readonly crud: CrudService<E, D>;

  constructor(entity: EntityTarget<E>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
    this.crud = new CrudService(this);
  }

  abstract entityToDto(entity: E): D;
}
