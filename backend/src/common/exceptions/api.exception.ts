import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true,
  ) {
    super(
      { statusCode, message, status: statusCode >= 500 ? 'error' : 'fail' },
      statusCode,
    );
  }

  static badRequest(message: string) {
    return new ApiException(HttpStatus.BAD_REQUEST, message);
  }

  static unauthorized(message = 'Please log in to get access.') {
    return new ApiException(HttpStatus.UNAUTHORIZED, message);
  }

  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiException(HttpStatus.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found.') {
    return new ApiException(HttpStatus.NOT_FOUND, message);
  }

  static conflict(message: string) {
    return new ApiException(HttpStatus.CONFLICT, message);
  }

  static tooManyRequests(message = 'Too many requests.') {
    return new ApiException(HttpStatus.TOO_MANY_REQUESTS, message);
  }
}
