import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../guards/supabase-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user) {
      throw new Error('CurrentUser used on a route without SupabaseAuthGuard');
    }
    return req.user;
  },
);
