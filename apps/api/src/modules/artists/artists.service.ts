import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import type { CreateArtistInput, UpdateArtistInput } from '@repo/types/artists';

import { toApi, type ArtistModel } from './artists.model';
import { ArtistsRepository } from './artists.repository';

@Injectable()
export class ArtistsService {
  constructor(private readonly repo: ArtistsRepository) {}

  async getById(id: string): Promise<ArtistModel> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`Artist ${id} not found`);
    return toApi(row);
  }

  async list(params: { take: number; skip: number }): Promise<ArtistModel[]> {
    const rows = await this.repo.list(params);
    return rows.map(toApi);
  }

  async create(input: CreateArtistInput): Promise<ArtistModel> {
    try {
      const row = await this.repo.create(input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Artist with that IPI number already exists');
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateArtistInput): Promise<ArtistModel> {
    try {
      const row = await this.repo.update(id, input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Artist ${id} not found`);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repo.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Artist ${id} not found`);
      }
      throw err;
    }
  }
}
