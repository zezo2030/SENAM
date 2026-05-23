import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const detail =
      exception instanceof HttpException
        ? this.extractDetail(exception)
        : 'An unexpected error occurred';

    const correlationId =
      (request.headers['x-correlation-id'] as string) ?? 'unknown';

    const body: ProblemDetail = {
      type: `https://senam.qa/errors/${status}`,
      title: HttpStatus[status] ?? 'Internal Server Error',
      status,
      detail,
      instance: request.url,
      correlationId,
    };

    response
      .status(status)
      .contentType('application/problem+json')
      .json(body);
  }

  private extractDetail(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null) {
      const r = response as Record<string, unknown>;
      if (typeof r['message'] === 'string') return r['message'];
      if (Array.isArray(r['message'])) return (r['message'] as string[]).join('; ');
    }
    return exception.message;
  }
}
