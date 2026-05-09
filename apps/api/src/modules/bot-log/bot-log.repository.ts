import { Injectable } from '@nestjs/common';
import type { BotLog as PrismaBotLog } from '@repo/database';
import type { CreateBotLogInput } from '@repo/types/bot-log';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BotLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaBotLog | null> {
    return this.prisma.botLog.findUnique({ where: { id } });
  }

  list(params: { take: number; skip: number; kind?: string }): Promise<PrismaBotLog[]> {
    return this.prisma.botLog.findMany({
      take: params.take,
      skip: params.skip,
      where: params.kind ? { kind: params.kind } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: CreateBotLogInput): Promise<PrismaBotLog> {
    return this.prisma.botLog.create({
      data: {
        kind: input.kind,
        text: input.text,
      },
    });
  }
}
