import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { getEnvironment } from '@nmxjs/utils';
import { EnvironmentEnum } from '@nmxjs/types';
import { GraphQLModule } from '@nestjs/graphql';
import { IGetGraphQlModuleOptions, IGetGraphQlModuleUseFactoryResult } from './interfaces';

export const getGraphQlModule = (options?: IGetGraphQlModuleOptions) =>
  GraphQLModule.forRootAsync<ApolloDriverConfig>({
    ...(options?.inject?.length ? { inject: options.inject } : {}),
    ...(options?.imports?.length ? { imports: options.imports } : {}),
    driver: ApolloDriver,
    useFactory: async (...params) => {
      const { origin, onSubscriptionConnect, onSubscriptionDisconnect }: IGetGraphQlModuleUseFactoryResult = options?.useFactory
        ? await options.useFactory(...params)
        : {};
      return {
        debug: false,
        autoSchemaFile: true,
        installSubscriptionHandlers: true,
        playground: getEnvironment() !== EnvironmentEnum.PRODUCTION,
        cors: {
          credentials: true,
          origin: [origin || process.env.ORIGIN || '*'],
        },
        formatError: (error: any) => ({
          ...(error.extensions.exception?.error?.code
            ? { code: error.extensions.exception.error.code }
            : error.extensions.code
            ? { code: error.extensions.code }
            : {}),
          ...(error.extensions.exception?.thrownValue?.code ? { code: error.extensions.exception.thrownValue.code } : {}),
          message:
            error.extensions.exception?.error?.message ||
            error.extensions.exception?.message ||
            error.extensions.exception?.thrownValue?.message ||
            error.toString(),
        }),
        ...(onSubscriptionConnect || onSubscriptionDisconnect
          ? {
              subscriptions: {
                'subscriptions-transport-ws': {
                  ...(onSubscriptionConnect ? { onConnect: onSubscriptionConnect } : {}),
                  ...(onSubscriptionDisconnect ? { onDisconnect: onSubscriptionDisconnect } : {}),
                },
              },
            }
          : {}),
        context: ctx => ({
          req: ctx.req,
          res: ctx.res,
        }),
      };
    },
  });
