import type { ApiErrorBody } from '@/lib/types';

export class HttpError extends Error {
  constructor(
    public status: number,
    public type: ApiErrorBody['type'],
    message: string,
  ) {
    super(message);
  }
}

export const bad = (m: string) => new HttpError(400, 'validation', m);
export const forbidden = (m: string) => new HttpError(403, 'forbidden', m);
export const notFound = (m: string) => new HttpError(404, 'not_found', m);
export const conflict = (m: string) => new HttpError(409, 'conflict', m);
