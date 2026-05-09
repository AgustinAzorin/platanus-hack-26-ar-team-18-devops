import type { Artist as PrismaArtist } from '@repo/database';
import type { Artist as ApiArtist } from '@repo/types/artists';

export type ArtistModel = ApiArtist;

export function toApi(row: PrismaArtist): ArtistModel {
  return {
    id: row.id,
    name: row.name,
    ipiNumber: row.ipiNumber,
    email: row.email,
    phone: row.phone,
    createdAt: row.createdAt,
  };
}
