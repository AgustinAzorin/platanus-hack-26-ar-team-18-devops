import { Injectable } from '@nestjs/common';
import type { Claim as PrismaClaim, ClaimMessage as PrismaClaimMessage } from '@repo/database';
import type {
  CreateClaimInput,
  UpdateClaimInput,
  CreateClaimMessageInput,
} from '@repo/types/claims';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClaimsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaClaim | null> {
    return this.prisma.claim.findUnique({ where: { id } });
  }

  list(params: { take: number; skip: number; status?: string; workId?: string }): Promise<PrismaClaim[]> {
    return this.prisma.claim.findMany({
      take: params.take,
      skip: params.skip,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.workId ? { workId: params.workId } : {}),
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  create(input: CreateClaimInput): Promise<PrismaClaim> {
    return this.prisma.claim.create({
      data: {
        workId: input.workId ?? null,
        source: input.source ?? 'CISAC',
        externalRef: input.externalRef ?? null,
        status: input.status ?? 'pending',
        cisacWorkTitle: input.cisacWorkTitle ?? null,
        performer: input.performer ?? null,
        usage: input.usage ?? null,
        venue: input.venue ?? null,
        executionDate: input.executionDate ?? null,
        period: input.period ?? null,
        amount: input.amount ?? null,
        reason: input.reason ?? null,
        deadline: input.deadline ?? null,
        confidence: input.confidence ?? null,
        cisacRawData: (input.cisacRawData as object) ?? null,
      },
    });
  }

  update(id: string, input: UpdateClaimInput): Promise<PrismaClaim> {
    return this.prisma.claim.update({
      where: { id },
      data: {
        ...(input.workId !== undefined ? { workId: input.workId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
        ...(input.matchSignals !== undefined ? { matchSignals: input.matchSignals as object } : {}),
        ...(input.requestedEvidence !== undefined ? { requestedEvidence: input.requestedEvidence as object } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        ...(input.deadline !== undefined ? { deadline: input.deadline } : {}),
        ...(input.resolvedAt !== undefined ? { resolvedAt: input.resolvedAt } : {}),
      },
    });
  }

  listMessages(claimId: string): Promise<PrismaClaimMessage[]> {
    return this.prisma.claimMessage.findMany({
      where: { claimId },
      orderBy: { sentAt: 'asc' },
    });
  }

  findMessage(id: string): Promise<PrismaClaimMessage | null> {
    return this.prisma.claimMessage.findUnique({ where: { id } });
  }

  createMessage(input: CreateClaimMessageInput): Promise<PrismaClaimMessage> {
    return this.prisma.claimMessage.create({
      data: {
        claimId: input.claimId,
        direction: input.direction,
        channel: input.channel,
        fromAddress: input.fromAddress ?? null,
        toAddress: input.toAddress ?? null,
        subject: input.subject ?? null,
        body: input.body,
        attachments: (input.attachments as object) ?? null,
      },
    });
  }
}
