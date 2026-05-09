import { z } from 'zod';

export const ClaimMessageSchema = z.object({
  id: z.string().uuid(),
  claimId: z.string().uuid(),
  direction: z.enum(['inbound', 'outbound']),
  channel: z.string(),
  fromAddress: z.string().nullable(),
  toAddress: z.string().nullable(),
  subject: z.string().nullable(),
  body: z.string(),
  attachments: z.unknown().nullable(),
  sentAt: z.coerce.date(),
});

export type ClaimMessage = z.infer<typeof ClaimMessageSchema>;

export const ClaimSchema = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid().nullable(),
  source: z.string(),
  externalRef: z.string().nullable(),
  status: z.string(),
  cisacWorkTitle: z.string().nullable(),
  performer: z.string().nullable(),
  usage: z.string().nullable(),
  venue: z.string().nullable(),
  executionDate: z.coerce.date().nullable(),
  period: z.string().nullable(),
  amount: z.number().nullable(),
  reason: z.string().nullable(),
  deadline: z.coerce.date().nullable(),
  confidence: z.number().nullable(),
  matchedAt: z.coerce.date().nullable(),
  matchSignals: z.unknown().nullable(),
  requestedEvidence: z.unknown().nullable(),
  cisacRawData: z.unknown().nullable(),
  receivedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
});

export type Claim = z.infer<typeof ClaimSchema>;

export const CreateClaimSchema = z.object({
  workId: z.string().uuid().optional().nullable(),
  source: z.string().default('CISAC'),
  externalRef: z.string().optional().nullable(),
  status: z.string().default('pending'),
  cisacWorkTitle: z.string().optional().nullable(),
  performer: z.string().optional().nullable(),
  usage: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  executionDate: z.coerce.date().optional().nullable(),
  period: z.string().optional().nullable(),
  amount: z.number().optional().nullable(),
  reason: z.string().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
  confidence: z.number().optional().nullable(),
  cisacRawData: z.unknown().optional().nullable(),
});

export type CreateClaimInput = z.infer<typeof CreateClaimSchema>;

export const UpdateClaimSchema = z.object({
  workId: z.string().uuid().optional().nullable(),
  status: z.string().optional(),
  confidence: z.number().optional().nullable(),
  matchSignals: z.unknown().optional().nullable(),
  requestedEvidence: z.unknown().optional().nullable(),
  reason: z.string().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
  resolvedAt: z.coerce.date().optional().nullable(),
});

export type UpdateClaimInput = z.infer<typeof UpdateClaimSchema>;

export const CreateClaimMessageSchema = z.object({
  claimId: z.string().uuid(),
  direction: z.enum(['inbound', 'outbound']),
  channel: z.string().min(1),
  fromAddress: z.string().optional().nullable(),
  toAddress: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  body: z.string().min(1),
  attachments: z.unknown().optional().nullable(),
});

export type CreateClaimMessageInput = z.infer<typeof CreateClaimMessageSchema>;
