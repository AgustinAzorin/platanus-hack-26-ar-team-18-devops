import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AuthResponse as ApiAuthResponse,
  RefreshTokenInput,
  Session,
  SignInInput,
  SignUpInput,
} from '@repo/types';
import type { Session as SupabaseSession } from '@supabase/supabase-js';

import { SupabaseService } from '../../supabase/supabase.service';
import type { UserModel } from '../users/users.model';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly users: UsersService,
  ) {}

  async signUp(input: SignUpInput): Promise<ApiAuthResponse> {
    // Use the anon client so the signup respects the project's email-confirmation
    // settings (sends confirmation email when enabled). If you want to bypass
    // confirmation in dev, switch to `supabase.admin.auth.admin.createUser({ email_confirm: true })`.
    const { data, error } = await this.supabase.anon.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: input.name ? { name: input.name } : undefined,
      },
    });

    if (error) {
      this.logger.warn(`signUp failed for ${input.email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    if (!data.user) {
      throw new BadRequestException('Supabase did not return a user');
    }

    // Mirror auth.users into our profile table. Idempotent: if the row already
    // exists (e.g. the user re-signs up with the same email after confirming),
    // we just fetch it.
    let profile: UserModel;
    try {
      profile = await this.users.create({
        id: data.user.id,
        email: data.user.email ?? input.email,
        name: input.name ?? null,
      });
    } catch (err) {
      // ConflictException → profile already exists, just load it.
      this.logger.debug(`Profile already existed for ${data.user.id}, fetching`);
      profile = await this.users.getById(data.user.id);
    }

    if (!data.session) {
      // Email confirmation required. No session is returned until the user
      // clicks the link. Surface this so the frontend can show the right UI.
      throw new BadRequestException(
        'Sign-up succeeded but email confirmation is required. Check your inbox.',
      );
    }

    return {
      user: profile,
      session: this.toSession(data.session),
    };
  }

  async signIn(input: SignInInput): Promise<ApiAuthResponse> {
    const { data, error } = await this.supabase.anon.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      this.logger.debug(`signIn failed for ${input.email}: ${error.message}`);
      throw new UnauthorizedException(error.message);
    }
    if (!data.session || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Self-heal: if a user existed in auth.users but not in our profile table
    // (legacy user, manual seed, etc.), create the profile lazily on first sign-in.
    let profile: UserModel;
    try {
      profile = await this.users.getById(data.user.id);
    } catch {
      this.logger.log(`Backfilling profile for ${data.user.id}`);
      profile = await this.users.create({
        id: data.user.id,
        email: data.user.email ?? input.email,
        name: (data.user.user_metadata?.name as string | undefined) ?? null,
      });
    }

    return {
      user: profile,
      session: this.toSession(data.session),
    };
  }

  async signOut(accessToken: string): Promise<void> {
    // admin.signOut revokes the refresh token associated with this JWT.
    const { error } = await this.supabase.admin.auth.admin.signOut(accessToken);
    if (error) {
      this.logger.warn(`signOut failed: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async refresh(input: RefreshTokenInput): Promise<Session> {
    const { data, error } = await this.supabase.anon.auth.refreshSession({
      refresh_token: input.refreshToken,
    });

    if (error || !data.session) {
      this.logger.debug(`refresh failed: ${error?.message ?? 'no session'}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.toSession(data.session);
  }

  private toSession(s: SupabaseSession): Session {
    return {
      accessToken: s.access_token,
      refreshToken: s.refresh_token,
      tokenType: 'bearer',
      expiresIn: s.expires_in,
      expiresAt: s.expires_at ?? Math.floor(Date.now() / 1000) + s.expires_in,
    };
  }
}
