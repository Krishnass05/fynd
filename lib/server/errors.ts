import type { ApiErrorBody } from '@/lib/types';

export class HttpError extends Error {
  constructor(
    public status: number,
    public type: ApiErrorBody['type'],
    message: string,
    public fields?: Record<string, string>, // per-field messages for forms
  ) {
    super(message);
  }
}

export const bad = (m: string, fields?: Record<string, string>) => new HttpError(400, 'validation', m, fields);
export const tooMany = (m: string) => new HttpError(429, 'forbidden', m);
export const forbidden = (m: string) => new HttpError(403, 'forbidden', m);
export const notFound = (m: string) => new HttpError(404, 'not_found', m);
export const conflict = (m: string) => new HttpError(409, 'conflict', m);
