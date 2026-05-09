import { Injectable } from '@nestjs/common';
import type { Evidence as PrismaEvidence } from '@repo/database';
import type { CreateEvidenceInput } from '@repo/types/evidence';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaEvidence | null> {
    return this.prisma.evidence.findUnique({ where: { id } });
  }

  list(params: { take: number; skip: number; workId?: string; type?: string }): Promise<PrismaEvidence[]> {
    return this.prisma.evidence.findMany({
      take: params.take,
      skip: params.skip,
      where: {
        ...(params.workId ? { workId: params.workId } : {}),
        ...(params.type ? { type: params.type } : {}),
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  create(input: CreateEvidenceInput): Promise<PrismaEvidence> {
    return this.prisma.evidence.create({
      data: {
        workId: input.workId,
        type: input.type,
        fileName: input.fileName ?? null,
        fileSize: input.fileSize ?? null,
        fileUrl: input.fileUrl,
        description: input.description ?? null,
      },
    });
  }

  delete(id: string): Promise<PrismaEvidence> {
    return this.prisma.evidence.delete({ where: { id } });
  }
}
