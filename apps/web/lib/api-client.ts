import {
  AnalyzePropertyResponseSchema,
  NeighborhoodsResponseSchema,
  UpdateUserSchema,
  UserSchema,
} from '@repo/types';
import type {
  AnalyzePropertyResponse,
  NeighborhoodsResponse,
  UpdateUserInput,
  User,
} from '@repo/types';
import type { z } from 'zod';

import { env } from './env';
import type { BackendSearchResponse } from './search/types';

class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly body: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<S extends z.ZodTypeAny>(
  path: string,
  init: RequestInit & { token?: string; schema: S },
): Promise<z.output<S>> {
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
    neighborhoods(): Promise<NeighborhoodsResponse> {
      return request('/analysis/neighborhoods', {
        method: 'GET',
        schema: NeighborhoodsResponseSchema,
      });
    },
    analyze(neighborhood: string): Promise<AnalyzePropertyResponse> {
      return request('/analysis/analyze', {
        method: 'POST',
        body: JSON.stringify({ neighborhood }),
        schema: AnalyzePropertyResponseSchema,
      });
    },
  },
  search: {
    /**
     * Calls the NestJS `/search/query` endpoint. The backend pipeline:
     *   1. Translator (Claude) parses `query` into structured filters.
     *   2. Executor queries Supabase + pgvector embeddings.
     *   3. Summarizer (Claude) builds a meta-report over the top results.
     * No Zod validation here yet because the schema isn't in @repo/types;
     * we trust the backend shape.
     */
    async query(query: string): Promise<BackendSearchResponse> {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/search/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        cache: 'no-store',
      });
      const text = await res.text();
      const json: unknown = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new ApiError(res.status, `API POST /search/query failed`, json);
      }
      return json as BackendSearchResponse;
    },
  },
};

export { ApiError };
