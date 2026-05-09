import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import type { CreateRecordingInput, UpdateRecordingInput } from '@repo/types/recordings';

import { toApi, type RecordingModel } from './recordings.model';
import { RecordingsRepository } from './recordings.repository';

@Injectable()
export class RecordingsService {
  constructor(private readonly repo: RecordingsRepository) {}

  async getById(id: string): Promise<RecordingModel> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`Recording ${id} not found`);
    return toApi(row);
  }

  async list(params: { take: number; skip: number; workId?: string }): Promise<RecordingModel[]> {
    const rows = await this.repo.list(params);
    return rows.map(toApi);
  }

  async create(input: CreateRecordingInput): Promise<RecordingModel> {
    try {
      const row = await this.repo.create(input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Recording with that ISRC already exists');
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateRecordingInput): Promise<RecordingModel> {
    try {
      const row = await this.repo.update(id, input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Recording ${id} not found`);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repo.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Recording ${id} not found`);
      }
      throw err;
    }
  }
}
