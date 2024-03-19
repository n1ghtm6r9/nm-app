import { Test } from '@nestjs/testing';
import { GqlExceptionFilter } from './GqlExceptionFilter';

export async function createTestNestHttpApp(module: Parameters<typeof Test.createTestingModule>[0]) {
  const moduleRef = await Test.createTestingModule(module).compile();
  const app = moduleRef.createNestApplication();

  app.useGlobalFilters(new GqlExceptionFilter());

  await app.init();

  return app;
}
