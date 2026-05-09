import { Injectable } from '@nestjs/common';
import type { Recording as PrismaRecording } from '@repo/database';
import type { CreateRecordingInput, UpdateRecordingInput } from '@repo/types/recordings';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecordingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaRecording | null> {
    return this.prisma.recording.findUnique({ where: { id } });
  }

  list(params: { take: number; skip: number; workId?: string }): Promise<PrismaRecording[]> {
    return this.prisma.recording.findMany({
      take: params.take,
      skip: params.skip,
      where: params.workId ? { workId: params.workId } : undefined,
      orderBy: { recordedAt: 'desc' },
    });
  }

  create(input: CreateRecordingInput): Promise<PrismaRecording> {
    return this.prisma.recording.create({
      data: {
        workId: input.workId,
        isrc: input.isrc ?? null,
        versionLabel: input.versionLabel ?? null,
        audioUrl: input.audioUrl ?? null,
        dawProjectUrl: input.dawProjectUrl ?? null,
        recordedAt: input.recordedAt ?? null,
      },
    });
  }

  update(id: string, input: UpdateRecordingInput): Promise<PrismaRecording> {
    return this.prisma.recording.update({
      where: { id },
      data: {
        ...(input.isrc !== undefined ? { isrc: input.isrc } : {}),
        ...(input.versionLabel !== undefined ? { versionLabel: input.versionLabel } : {}),
        ...(input.audioUrl !== undefined ? { audioUrl: input.audioUrl } : {}),
        ...(input.dawProjectUrl !== undefined ? { dawProjectUrl: input.dawProjectUrl } : {}),
        ...(input.recordedAt !== undefined ? { recordedAt: input.recordedAt } : {}),
      },
    });
  }

  delete(id: string): Promise<PrismaRecording> {
    return this.prisma.recording.delete({ where: { id } });
  }
}
