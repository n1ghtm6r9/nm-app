import { GraphQLError } from 'graphql';
import { ExceptionFilter, Catch } from '@nestjs/common';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  public catch(error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        http: { status: error.statusCode || 500 },
      },
    });
  }
}
