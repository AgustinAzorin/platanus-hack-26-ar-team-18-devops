import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import type { CreateContractInput, UpdateContractInput } from '@repo/types/contracts';

import { toApi, type ContractModel } from './contracts.model';
import { ContractsRepository } from './contracts.repository';

@Injectable()
export class ContractsService {
  constructor(private readonly repo: ContractsRepository) {}

  async getById(id: string): Promise<ContractModel> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`Contract ${id} not found`);
    return toApi(row);
  }

  async list(params: { take: number; skip: number; workId?: string }): Promise<ContractModel[]> {
    const rows = await this.repo.list(params);
    return rows.map(toApi);
  }

  async create(input: CreateContractInput): Promise<ContractModel> {
    const row = await this.repo.create(input);
    return toApi(row);
  }

  async update(id: string, input: UpdateContractInput): Promise<ContractModel> {
    try {
      const row = await this.repo.update(id, input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Contract ${id} not found`);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repo.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Contract ${id} not found`);
      }
      throw err;
    }
  }
}
