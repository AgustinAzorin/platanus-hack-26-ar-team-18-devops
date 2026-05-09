import type { Claim as PrismaClaim, ClaimMessage as PrismaClaimMessage } from '@repo/database';
import type { Claim as ApiClaim, ClaimMessage as ApiClaimMessage } from '@repo/types/claims';

export type ClaimModel = ApiClaim;
export type ClaimMessageModel = ApiClaimMessage;

export function toApi(row: PrismaClaim): ClaimModel {
  return {
    id: row.id,
    workId: row.workId,
    source: row.source,
    externalRef: row.externalRef,
    status: row.status,
    cisacWorkTitle: row.cisacWorkTitle,
    performer: row.performer,
    usage: row.usage,
    venue: row.venue,
    executionDate: row.executionDate,
    period: row.period,
    amount: row.amount !== null ? Number(row.amount) : null,
    reason: row.reason,
    deadline: row.deadline,
    confidence: row.confidence,
    matchedAt: row.matchedAt,
    matchSignals: row.matchSignals,
    requestedEvidence: row.requestedEvidence,
    cisacRawData: row.cisacRawData,
    receivedAt: row.receivedAt,
    resolvedAt: row.resolvedAt,
  };
}

export function messageToApi(row: PrismaClaimMessage): ClaimMessageModel {
  return {
    id: row.id,
    claimId: row.claimId,
    direction: row.direction as 'inbound' | 'outbound',
    channel: row.channel,
    fromAddress: row.fromAddress,
    toAddress: row.toAddress,
    subject: row.subject,
    body: row.body,
    attachments: row.attachments,
    sentAt: row.sentAt,
  };
}
