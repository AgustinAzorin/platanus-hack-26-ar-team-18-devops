import type { Work as PrismaWork, WorkContributor as PrismaWorkContributor } from '@repo/database';
import type { Work as ApiWork, WorkContributor as ApiWorkContributor } from '@repo/types/works';

export type WorkModel = ApiWork;
export type WorkContributorModel = ApiWorkContributor;

export function toApi(row: PrismaWork): WorkModel {
  return {
    id: row.id,
    artistId: row.artistId,
    title: row.title,
    iswc: row.iswc,
    genre: row.genre,
    lyrics: row.lyrics,
    durationSec: row.durationSec,
    creationDate: row.creationDate,
    registeredAt: row.registeredAt,
  };
}

export function contributorToApi(row: PrismaWorkContributor): WorkContributorModel {
  return {
    id: row.id,
    workId: row.workId,
    artistId: row.artistId,
    role: row.role,
    splitPercentage: Number(row.splitPercentage),
  };
}
