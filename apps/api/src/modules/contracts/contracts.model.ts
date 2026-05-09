import type { Contract as PrismaContract } from '@repo/database';
import type { Contract as ApiContract } from '@repo/types/contracts';

export type ContractModel = ApiContract;

export function toApi(row: PrismaContract): ContractModel {
  return {
    id: row.id,
    workId: row.workId,
    partyName: row.partyName,
    contractType: row.contractType,
    fileUrl: row.fileUrl,
    signedAt: row.signedAt,
    expiresAt: row.expiresAt,
  };
}
