import type { User as PrismaUser } from '@repo/database';
import type { User as ApiUser } from '@repo/types/users';

/**
 * Domain model for users.
 *
 * `ApiUser` is the wire shape (from @repo/types) and what the controller returns.
 * `PrismaUser` is the row shape from the database.
 * Mapping happens in `toApi()` so we never leak Prisma internals through HTTP.
 */
export type UserModel = ApiUser;

export function toApi(row: PrismaUser): UserModel {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
