import { Injectable } from '@nestjs/common';
import type { User as PrismaUser } from '@repo/database';
import type { CreateUserInput, UpdateUserInput } from '@repo/types';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  list(params: { take: number; skip: number }): Promise<PrismaUser[]> {
    return this.prisma.user.findMany({
      take: params.take,
      skip: params.skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: CreateUserInput): Promise<PrismaUser> {
    return this.prisma.user.create({
      data: {
        id: input.id,
        email: input.email,
        name: input.name ?? null,
        avatarUrl: input.avatarUrl ?? null,
      },
    });
  }

  update(id: string, input: UpdateUserInput): Promise<PrismaUser> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
    });
  }

  delete(id: string): Promise<PrismaUser> {
    return this.prisma.user.delete({ where: { id } });
  }
}
