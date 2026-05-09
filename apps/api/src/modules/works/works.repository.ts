import { Injectable } from '@nestjs/common';
import type { Work as PrismaWork, WorkContributor as PrismaWorkContributor } from '@repo/database';
import type {
  CreateWorkInput,
  UpdateWorkInput,
  CreateWorkContributorInput,
  UpdateWorkContributorInput,
} from '@repo/types/works';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaWork | null> {
    return this.prisma.work.findUnique({ where: { id } });
  }

  list(params: { take: number; skip: number; artistId?: string }): Promise<PrismaWork[]> {
    return this.prisma.work.findMany({
      take: params.take,
      skip: params.skip,
      where: params.artistId ? { artistId: params.artistId } : undefined,
      orderBy: { registeredAt: 'desc' },
    });
  }

  create(input: CreateWorkInput): Promise<PrismaWork> {
    return this.prisma.work.create({
      data: {
        artistId: input.artistId,
        title: input.title,
        iswc: input.iswc ?? null,
        genre: input.genre ?? null,
        lyrics: input.lyrics ?? null,
        durationSec: input.durationSec ?? null,
        creationDate: input.creationDate ?? null,
      },
    });
  }

  update(id: string, input: UpdateWorkInput): Promise<PrismaWork> {
    return this.prisma.work.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.iswc !== undefined ? { iswc: input.iswc } : {}),
        ...(input.genre !== undefined ? { genre: input.genre } : {}),
        ...(input.lyrics !== undefined ? { lyrics: input.lyrics } : {}),
        ...(input.durationSec !== undefined ? { durationSec: input.durationSec } : {}),
        ...(input.creationDate !== undefined ? { creationDate: input.creationDate } : {}),
      },
    });
  }

  delete(id: string): Promise<PrismaWork> {
    return this.prisma.work.delete({ where: { id } });
  }

  listContributors(workId: string): Promise<PrismaWorkContributor[]> {
    return this.prisma.workContributor.findMany({ where: { workId } });
  }

  findContributor(id: string): Promise<PrismaWorkContributor | null> {
    return this.prisma.workContributor.findUnique({ where: { id } });
  }

  createContributor(input: CreateWorkContributorInput): Promise<PrismaWorkContributor> {
    return this.prisma.workContributor.create({
      data: {
        workId: input.workId,
        artistId: input.artistId,
        role: input.role,
        splitPercentage: input.splitPercentage,
      },
    });
  }

  updateContributor(id: string, input: UpdateWorkContributorInput): Promise<PrismaWorkContributor> {
    return this.prisma.workContributor.update({
      where: { id },
      data: {
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.splitPercentage !== undefined ? { splitPercentage: input.splitPercentage } : {}),
      },
    });
  }

  deleteContributor(id: string): Promise<PrismaWorkContributor> {
    return this.prisma.workContributor.delete({ where: { id } });
  }
}
