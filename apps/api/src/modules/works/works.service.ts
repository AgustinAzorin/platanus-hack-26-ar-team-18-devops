import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import type {
  CreateWorkInput,
  UpdateWorkInput,
  CreateWorkContributorInput,
  UpdateWorkContributorInput,
} from '@repo/types/works';

import { toApi, contributorToApi, type WorkModel, type WorkContributorModel } from './works.model';
import { WorksRepository } from './works.repository';

@Injectable()
export class WorksService {
  constructor(private readonly repo: WorksRepository) {}

  async getById(id: string): Promise<WorkModel> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`Work ${id} not found`);
    return toApi(row);
  }

  async list(params: { take: number; skip: number; artistId?: string }): Promise<WorkModel[]> {
    const rows = await this.repo.list(params);
    return rows.map(toApi);
  }

  async create(input: CreateWorkInput): Promise<WorkModel> {
    try {
      const row = await this.repo.create(input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Work with that ISWC already exists');
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateWorkInput): Promise<WorkModel> {
    try {
      const row = await this.repo.update(id, input);
      return toApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Work ${id} not found`);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repo.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Work ${id} not found`);
      }
      throw err;
    }
  }

  async listContributors(workId: string): Promise<WorkContributorModel[]> {
    await this.getById(workId);
    const rows = await this.repo.listContributors(workId);
    return rows.map(contributorToApi);
  }

  async createContributor(input: CreateWorkContributorInput): Promise<WorkContributorModel> {
    try {
      const row = await this.repo.createContributor(input);
      return contributorToApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Artist is already a contributor to this work');
      }
      throw err;
    }
  }

  async updateContributor(id: string, input: UpdateWorkContributorInput): Promise<WorkContributorModel> {
    try {
      const row = await this.repo.updateContributor(id, input);
      return contributorToApi(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Contributor ${id} not found`);
      }
      throw err;
    }
  }

  async deleteContributor(id: string): Promise<void> {
    try {
      await this.repo.deleteContributor(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Contributor ${id} not found`);
      }
      throw err;
    }
  }
}
