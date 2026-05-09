import { z } from 'zod';

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid(),
  type: z.string(),
  fileName: z.string().nullable(),
  fileSize: z.string().nullable(),
  fileUrl: z.string(),
  description: z.string().nullable(),
  uploadedAt: z.coerce.date(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const CreateEvidenceSchema = z.object({
  workId: z.string().uuid(),
  type: z.string().min(1),
  fileName: z.string().optional().nullable(),
  fileSize: z.string().optional().nullable(),
  fileUrl: z.string().min(1),
  description: z.string().optional().nullable(),
});

export type CreateEvidenceInput = z.infer<typeof CreateEvidenceSchema>;
