import { Injectable } from '@nestjs/common';
import type { Contract as PrismaContract } from '@repo/database';
import type { CreateContractInput, UpdateContractInput } from '@repo/types/contracts';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContractsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaContract | null> {
    return this.prisma.contract.findUnique({ where: { id } });
  }

  list(params: { take: number; skip: number; workId?: string }): Promise<PrismaContract[]> {
    return this.prisma.contract.findMany({
      take: params.take,
      skip: params.skip,
      where: params.workId ? { workId: params.workId } : undefined,
      orderBy: { signedAt: 'desc' },
    });
  }

  create(input: CreateContractInput): Promise<PrismaContract> {
    return this.prisma.contract.create({
      data: {
        workId: input.workId,
        partyName: input.partyName,
        contractType: input.contractType,
        fileUrl: input.fileUrl,
        signedAt: input.signedAt ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });
  }

  update(id: string, input: UpdateContractInput): Promise<PrismaContract> {
    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(input.partyName !== undefined ? { partyName: input.partyName } : {}),
        ...(input.contractType !== undefined ? { contractType: input.contractType } : {}),
        ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
        ...(input.signedAt !== undefined ? { signedAt: input.signedAt } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      },
    });
  }

  delete(id: string): Promise<PrismaContract> {
    return this.prisma.contract.delete({ where: { id } });
  }
}
