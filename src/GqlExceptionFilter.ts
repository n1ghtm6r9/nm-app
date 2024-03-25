import { GraphQLError } from 'graphql';
import { ExceptionFilter, Catch } from '@nestjs/common';
import { AlreadyExistError } from '@nmxjs/errors';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  public catch(error) {
    if (error.code === '23505') {
      error = new AlreadyExistError();
    }

    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        http: { status: error.statusCode || 500 },
      },
    });
  }
}
