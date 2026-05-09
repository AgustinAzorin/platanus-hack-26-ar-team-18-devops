import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import type { CreateUserInput, UpdateUserInput } from '@repo/types';

import { toApi, type UserModel } from './users.model';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async getById(id: string): Promise<UserModel> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`User ${id} not found`);
    return toApi(row);
  }

  async list(params: { take: number; skip: number }): Promise<UserModel[]> {
    const rows = await this.repo.list(params);
    return rows.map(toApi);
  }

  async create(input: CreateUserInput): Promise<UserModel> {
    try {
      const row = await this.repo.create(input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('User with that id or email already exists');
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<UserModel> {
    try {
      const row = await this.repo.update(id, input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`User ${id} not found`);
      }
      throw err;
    }
  }
}
