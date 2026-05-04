export interface ApiResponseBody<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

export class ApiResponseHelper {
  static success<T>(data: T, message = 'Success', statusCode?: number): ApiResponseBody<T> {
    const code = statusCode ?? 200;
    return {
      success: true,
      statusCode: code,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static created<T>(data: T, message = 'Resource created successfully') {
    return this.success(data, message, 201);
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Data retrieved successfully',
  ) {
    return this.success(
      {
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
      message,
    );
  }
}
