import { ModuleMetadata } from '@nestjs/common';
import { IGetGraphQlModuleUseFactoryResult } from './IGetGraphQlModuleUseFactoryResult';

export interface IGetGraphQlModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: Array<string | symbol>;
  config?: Record<string, any>;
  useFactory?: (...params) => IGetGraphQlModuleUseFactoryResult | Promise<IGetGraphQlModuleUseFactoryResult>;
}
