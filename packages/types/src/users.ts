import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(120).nullable(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.pick({
  email: true,
  name: true,
}).extend({
  id: z.string().uuid(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).max(120).nullable(),
    avatarUrl: z.string().url().nullable(),
  })
  .partial();

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
