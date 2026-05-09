import {
  AnalyzePropertyResponseSchema,
  UpdateUserSchema,
  UserSchema,
} from '@repo/types';
import type {
  AnalyzePropertyResponse,
  UpdateUserInput,
  User,
} from '@repo/types';
import type { z } from 'zod';

import { env } from './env';

class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly body: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string; schema: z.ZodType<T> },
): Promise<T> {
  const { token, schema, ...rest } = init;

  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    ...rest,
    headers,
    cache: 'no-store',
  });

  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, `API ${rest.method ?? 'GET'} ${path} failed`, json);
  }

  return schema.parse(json);
}

export const apiClient = {
  users: {
    me(token: string): Promise<User> {
      return request('/users/me', { method: 'GET', token, schema: UserSchema });
    },
    updateMe(token: string, input: UpdateUserInput): Promise<User> {
      return request('/users/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify(UpdateUserSchema.parse(input)),
        schema: UserSchema,
      });
    },
  },
  analysis: {
    analyze(url: string): Promise<AnalyzePropertyResponse> {
      return request('/analysis/analyze', {
        method: 'POST',
        body: JSON.stringify({ url }),
        schema: AnalyzePropertyResponseSchema,
      });
    },
  },
};

export { ApiError };
