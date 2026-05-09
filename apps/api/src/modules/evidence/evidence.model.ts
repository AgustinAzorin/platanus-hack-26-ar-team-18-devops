import type { Evidence as PrismaEvidence } from '@repo/database';
import type { Evidence as ApiEvidence } from '@repo/types/evidence';

export type EvidenceModel = ApiEvidence;

export function toApi(row: PrismaEvidence): EvidenceModel {
  return {
    id: row.id,
    workId: row.workId,
    type: row.type,
    fileName: row.fileName,
    fileSize: row.fileSize,
    fileUrl: row.fileUrl,
    description: row.description,
    uploadedAt: row.uploadedAt,
  };
}
