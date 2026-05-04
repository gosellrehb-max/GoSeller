import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiException } from '../exceptions/api.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let isOperational = false;

    if (exception instanceof ApiException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'object' && body && 'message' in body ? (body as { message: string }).message : exception.message;
      isOperational = exception.isOperational;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'object' && body && 'message' in body
        ? (Array.isArray((body as { message: unknown }).message)
            ? (body as { message: string[] }).message.join(', ')
            : (body as { message: string }).message)
        : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      if (exception.name === 'CastError') {
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
      }
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
      }
      const errCode = (exception as { code?: number }).code;
      if (errCode === 11000) {
        status = HttpStatus.BAD_REQUEST;
        const keyPattern = (exception as { keyPattern?: Record<string, number> }).keyPattern;
        const keyValue = (exception as { keyValue?: Record<string, unknown> }).keyValue;
        if (keyPattern?.email != null || (keyValue && Object.prototype.hasOwnProperty.call(keyValue, 'email'))) {
          message = 'This email is already registered.';
        } else {
          message = 'Duplicate field value. Please use another value.';
        }
      }
    }

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(process.env.NODE_ENV === 'development' && exception instanceof Error && { stack: exception.stack }),
    };

    response.status(status).json(errorResponse);
  }
}
