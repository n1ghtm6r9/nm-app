import { DynamicModule, Logger } from '@nestjs/common';
import { getEnvironment, parseJson } from '@nmxjs/utils';
import { EnvironmentEnum } from '@nmxjs/types';
import { pruneSchema } from '@graphql-tools/utils';
import { IGetGraphQlModuleOptions, IGetGraphQlModuleUseFactoryResult } from './interfaces';

const { ApolloDriver } = require('@nestjs/apollo');
const { GraphQLModule } = require('@nestjs/graphql');

const unexpectedErrorMessage = 'Unexpected error value: ';

let isGraphQlModuleExits = false;

export const checkIsGraphQlModuleExits = () => isGraphQlModuleExits;

export const getGraphQlModule = (options?: IGetGraphQlModuleOptions): DynamicModule =>
  GraphQLModule.forRootAsync({
    ...(options?.inject?.length ? { inject: options.inject } : {}),
    ...(options?.imports?.length ? { imports: options.imports } : {}),
    driver: ApolloDriver,
    useFactory: async (...params) => {
      const {
        resolvers = {},
        onSubscriptionConnect,
        onSubscriptionDisconnect,
        config = {},
      }: IGetGraphQlModuleUseFactoryResult = options?.useFactory ? await options.useFactory(...params) : {};
      isGraphQlModuleExits = true;

      if (process.env.DEBUG === 'true') {
        Logger.debug(`GraphQL module initialized, resolvers: ${Object.keys(resolvers).join(', ') || 'none'}`);
      }

      return {
        uploads: false,
        autoTransformHttpErrors: false,
        autoSchemaFile: true,
        transformSchema: pruneSchema,
        installSubscriptionHandlers: true,
        graphiql: getEnvironment() !== EnvironmentEnum.PRODUCTION,
        fieldResolverEnhancers: ['filters', 'guards', 'interceptors'],
        resolvers,
        formatError: (error: any, originalError?: any) => {
          const thrownValue =
            originalError?.originalError?.thrownValue ??
            originalError?.thrownValue ??
            (error.message?.startsWith(unexpectedErrorMessage)
              ? parseJson({ data: error.message.substring(unexpectedErrorMessage.length) })
              : null);

          return {
            ...(error.extensions?.exception?.error?.code
              ? { code: error.extensions.exception.error.code }
              : error.extensions?.code
                ? { code: error.extensions.code }
                : {}),
            ...(error.extensions?.exception?.thrownValue?.code ? { code: error.extensions.exception.thrownValue.code } : {}),
            ...(thrownValue?.code ? { code: thrownValue.code } : {}),
            message:
              error.extensions?.exception?.error?.message ||
              error.extensions?.exception?.message ||
              error.extensions?.exception?.thrownValue?.message ||
              thrownValue?.message ||
              error.message ||
              error.toString(),
          };
        },
        subscriptions: {
          'subscriptions-transport-ws': {
            onConnect: (connectionParams, client) => ({
              client,
              connectionParams,
              ...(onSubscriptionConnect ? onSubscriptionConnect(connectionParams, client) : {}),
            }),
            ...(onSubscriptionDisconnect ? { onDisconnect: onSubscriptionDisconnect } : {}),
          },
        },
        context: ctx => ({
          req: ctx.req,
          res: ctx.res,
        }),
        ...(options?.config ?? {}),
        ...(config ?? {}),
      };
    },
  });
