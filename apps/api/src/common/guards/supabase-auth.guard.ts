import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { jwtVerify } from 'jose';

import type { Env } from '../../config/env.schema';

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
  role: string | undefined;
  raw: Record<string, unknown>;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  private readonly secret: Uint8Array;

  constructor(private readonly config: ConfigService<Env, true>) {
    const jwtSecret = this.config.get('SUPABASE_JWT_SECRET', { infer: true });
    this.secret = new TextEncoder().encode(jwtSecret);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ['HS256'],
      });

      if (typeof payload.sub !== 'string') {
        throw new UnauthorizedException('Invalid token: missing sub');
      }

      req.user = {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        role: typeof payload.role === 'string' ? payload.role : undefined,
        raw: payload as Record<string, unknown>,
      };
      return true;
    } catch (err) {
      this.logger.debug(`JWT verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string') return null;
    const [scheme, value] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !value) return null;
    return value;
  }
}
