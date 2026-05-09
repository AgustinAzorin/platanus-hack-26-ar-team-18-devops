import { Injectable } from '@nestjs/common';
import type { Artist as PrismaArtist } from '@repo/database';
import type { CreateArtistInput, UpdateArtistInput } from '@repo/types/artists';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ArtistsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaArtist | null> {
    return this.prisma.artist.findUnique({ where: { id } });
  }

  findByIpiNumber(ipiNumber: string): Promise<PrismaArtist | null> {
    return this.prisma.artist.findUnique({ where: { ipiNumber } });
  }

  list(params: { take: number; skip: number }): Promise<PrismaArtist[]> {
    return this.prisma.artist.findMany({
      take: params.take,
      skip: params.skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: CreateArtistInput): Promise<PrismaArtist> {
    return this.prisma.artist.create({
      data: {
        name: input.name,
        ipiNumber: input.ipiNumber ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
      },
    });
  }

  update(id: string, input: UpdateArtistInput): Promise<PrismaArtist> {
    return this.prisma.artist.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.ipiNumber !== undefined ? { ipiNumber: input.ipiNumber } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
    });
  }

  delete(id: string): Promise<PrismaArtist> {
    return this.prisma.artist.delete({ where: { id } });
  }
}
