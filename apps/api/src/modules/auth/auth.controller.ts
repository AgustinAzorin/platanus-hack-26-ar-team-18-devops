import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthResponse, Session } from '@repo/types';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  type AuthenticatedUser,
  SupabaseAuthGuard,
} from '../../common/guards/supabase-auth.guard';
import type { UserModel } from '../users/users.model';
import { UsersService } from '../users/users.service';

import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up with email + password (creates Supabase user + profile row)' })
  signUp(@Body() body: SignUpDto): Promise<AuthResponse> {
    return this.auth.signUp(body);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email + password' })
  signIn(@Body() body: SignInDto): Promise<AuthResponse> {
    return this.auth.signIn(body);
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Revoke the current session' })
  async signOut(@Req() req: Request): Promise<void> {
    const token = this.extractBearer(req);
    await this.auth.signOut(token);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new session' })
  refresh(@Body() body: RefreshTokenDto): Promise<Session> {
    return this.auth.refresh(body);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Return the profile for the currently authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserModel> {
    return this.users.getById(user.id);
  }

  private extractBearer(req: Request): string {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string') {
      throw new UnauthorizedException('Missing bearer token');
    }
    const [scheme, value] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !value) {
      throw new UnauthorizedException('Invalid Authorization header');
    }
    return value;
  }
}
