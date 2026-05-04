import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { ApiException } from '../../common/exceptions/api.exception';

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_UPLOAD_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 700;

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {
    const cloudName = this.config.get<string>('cloudinary.cloudName');
    const apiKey = this.config.get<string>('cloudinary.apiKey');
    const apiSecret = this.config.get<string>('cloudinary.apiSecret');
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    }
  }

  private validateFile(mimetype: string, size: number): void {
    if (!ALLOWED_MIMES.includes(mimetype)) {
      throw ApiException.badRequest(
        'Invalid file type. Allowed: JPEG, PNG, GIF, WebP.',
      );
    }
    if (size > MAX_FILE_SIZE_BYTES) {
      throw ApiException.badRequest(
        `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
      );
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableUploadError(err: unknown): boolean {
    const message = String((err as { message?: unknown })?.message ?? err ?? '').toLowerCase();
    return (
      message.includes('eai_again') ||
      message.includes('enotfound') ||
      message.includes('etimedout') ||
      message.includes('econnreset') ||
      message.includes('timeout') ||
      message.includes('socket hang up') ||
      message.includes('network')
    );
  }

  private async uploadToCloudinary(buffer: Buffer, folder: string, originalName?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          public_id: originalName?.replace(/\.[^.]+$/, '') ?? undefined,
        },
        (err, result) => {
          if (err) {
            reject(new Error(`Upload failed: ${err.message}`));
            return;
          }
          if (!result?.secure_url) {
            reject(new Error('Upload failed: no URL returned'));
            return;
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(buffer);
    });
  }

  async uploadImage(buffer: Buffer, mimetype: string, originalName?: string): Promise<string> {
    this.validateFile(mimetype, buffer.length);

    const cloudName = this.config.get<string>('cloudinary.cloudName');
    const apiKey = this.config.get<string>('cloudinary.apiKey');
    const apiSecret = this.config.get<string>('cloudinary.apiSecret');
    if (!cloudName || !apiKey || !apiSecret) {
      throw ApiException.badRequest(
        'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
      );
    }

    const folder = this.config.get<string>('cloudinary.folder') ?? 'goseller';
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt += 1) {
      try {
        return await this.uploadToCloudinary(buffer, folder, originalName);
      } catch (err) {
        lastError = err;
        const retryable = this.isRetryableUploadError(err);
        const hasAttemptsLeft = attempt < MAX_UPLOAD_RETRIES;
        if (retryable && hasAttemptsLeft) {
          const delayMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
          await this.sleep(delayMs);
          continue;
        }
        break;
      }
    }

    const baseMessage = String((lastError as { message?: unknown })?.message ?? 'Upload failed');
    const retryable = this.isRetryableUploadError(lastError);
    const friendlyAdvice = retryable
      ? ' Please check that your internet connection is stable and try again in a moment.'
      : '';
    throw ApiException.badRequest(
      `${baseMessage}${friendlyAdvice} (attempted ${MAX_UPLOAD_RETRIES} times)`,
    );
  }
}
