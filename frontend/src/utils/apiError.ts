import type { AxiosError } from 'axios';

/** Reads Nest/axios error body: `{ message: string }` from HttpExceptionFilter. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as AxiosError<{ message?: string; error?: { message?: string } }>;
    const data = axiosErr.response?.data;
    if (data && typeof data === 'object') {
      const m = data.message;
      if (typeof m === 'string' && m.trim()) return m;
      const nested = data.error?.message;
      if (typeof nested === 'string' && nested.trim()) return nested;
    }
  }
  if (error instanceof Error && error.message && !error.message.startsWith('Request failed with status code')) {
    return error.message;
  }
  return fallback;
}
