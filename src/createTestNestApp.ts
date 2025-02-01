import { Test } from '@nestjs/testing';
import { ClientsModule, Transport } from '@nestjs/microservices';

export async function createTestNestApp(module: Parameters<typeof Test.createTestingModule>[0]) {
  const clientKey = Symbol('CLIENT_KEY');

  module.imports.push(ClientsModule.register([{ name: clientKey, transport: Transport.TCP }]));

  const moduleFixture = await Test.createTestingModule(module).compile();
  const app = moduleFixture.createNestApplication();

  app.connectMicroservice({
    transport: Transport.TCP,
  });

  await app.startAllMicroservices();
  await app.init();

  const client = app.get(clientKey);
  await client.connect();

  return {
    app,
    client,
  };
}
