import { GraphQLError } from 'graphql';
import { ExceptionFilter, Catch, NotFoundException } from '@nestjs/common';
import { AlreadyExistError } from '@nmxjs/errors';
import type { INotifier } from '@nmxjs/notifications';
import { getPathFromGraphQl } from '@nmxjs/utils';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  constructor(private readonly serviceName: string, private readonly notifier?: INotifier) {}

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
      this.notifier.sendError({
        message: error.message.split('\n    at')[0],
        serviceName: this.serviceName,
        path: getPathFromGraphQl(host.args[2].req.body.query),
        code: error.code || 'UNKNOWN GQL',
        params: host.args[1],
      });
    }

    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        http: { status: error.statusCode || 500 },
      },
    });
  }
}
