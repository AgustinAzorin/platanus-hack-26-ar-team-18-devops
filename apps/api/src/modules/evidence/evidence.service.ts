import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import type { CreateEvidenceInput } from '@repo/types/evidence';

import { toApi, type EvidenceModel } from './evidence.model';
import { EvidenceRepository } from './evidence.repository';

@Injectable()
export class EvidenceService {
  constructor(private readonly repo: EvidenceRepository) {}

  async getById(id: string): Promise<EvidenceModel> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`Evidence ${id} not found`);
    return toApi(row);
  }

  async list(params: { take: number; skip: number; workId?: string; type?: string }): Promise<EvidenceModel[]> {
    const rows = await this.repo.list(params);
    return rows.map(toApi);
  }

  async create(input: CreateEvidenceInput): Promise<EvidenceModel> {
    const row = await this.repo.create(input);
    return toApi(row);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repo.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Evidence ${id} not found`);
      }
      throw err;
    }
  }
}
