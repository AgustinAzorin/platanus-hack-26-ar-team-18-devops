import { z } from 'zod';

import { UserSchema } from './users';

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(120).optional(),
});
export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});
export type SignInInput = z.infer<typeof SignInSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const SessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('bearer'),
  expiresIn: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});
export type Session = z.infer<typeof SessionSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  session: SessionSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
