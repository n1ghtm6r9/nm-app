import { GraphQLError } from 'graphql';
import { ExceptionFilter, Catch, NotFoundException } from '@nestjs/common';
import { AlreadyExistError } from '@nmxjs/errors';
import type { INotifier } from '@nmxjs/notifications';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  constructor(private readonly notifier?: INotifier) {}

  public catch(error, host) {
    if (error.code === '23505') {
      error = new AlreadyExistError();
    }

    if (error instanceof NotFoundException) {
      const ctx = host.switchToHttp();
      const res = ctx.getResponse();
      return res.status(404).json({ message: { statusCode: 404, error: 'Not Found', message: error.message } });
    }

    if (this.notifier && !error.silent) {
      this.notifier.sendError(error);
    }

    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        http: { status: error.statusCode || 500 },
      },
    });
  }
}
