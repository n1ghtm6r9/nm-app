import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { getEnvironment } from '@nmxjs/utils';
import { EnvironmentEnum } from '@nmxjs/types';
import { GraphQLModule } from '@nestjs/graphql';

export const getGraphQlModule = () =>
  GraphQLModule.forRootAsync<ApolloDriverConfig>({
    driver: ApolloDriver,
    useFactory: () => ({
      debug: false,
      autoSchemaFile: true,
      installSubscriptionHandlers: true,
      playground: getEnvironment() !== EnvironmentEnum.PRODUCTION,
      cors: {
        credentials: true,
        origin: [process.env.ORIGIN || '*'],
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
      context: ctx => ({
        req: ctx.req,
        res: ctx.res,
      }),
    }),
  });
