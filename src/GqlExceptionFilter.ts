import { GraphQLError } from 'graphql';
import { ExceptionFilter, Catch, NotFoundException, Logger } from '@nestjs/common';
import { AlreadyExistError } from '@nmxjs/errors';
import type { INotifier } from '@nmxjs/notifications';
import { getPathFromGraphQl } from '@nmxjs/utils';
import { parseRpcError } from '@nmxjs/api';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly serviceName: string,
    private readonly notifier?: INotifier,
    private readonly excludeUploadPaths?: string[],
  ) {}

  private isExcludedPath(path: string | undefined): boolean {
    if (!path) return false;
    return (
      this.excludeUploadPaths?.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]+') + '$');
          return regex.test(path);
        }
        return path === pattern || path.startsWith(pattern);
      }) ?? false
    );
  }

  public catch(error, host) {
    error = parseRpcError(error);

    if (process.env.DEBUG === 'true') {
      Logger.debug(`GqlExceptionFilter caught: ${error.message}\n${error.stack}`);
    }

    if (error.code === '23505') {
      error = new AlreadyExistError();
    }

    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    if (error instanceof NotFoundException || this.isExcludedPath(req?.path)) {
      return res.status(error.statusCode || 404).json({ message: error.message, code: error.code });
    }

    if (this.notifier && !error.silent) {
      const query = host.args?.[2]?.req?.body?.query;
      this.notifier.sendError({
        message: error.message.split('\n    at')[0],
        serviceName: this.serviceName,
        path: query ? getPathFromGraphQl(query) : undefined,
        code: error.code || 'UNKNOWN GQL',
        params: host.args[1]?.req === host.args[0] ? undefined : host.args[1],
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
