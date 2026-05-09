import { z } from 'zod';

export const RecordingSchema = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid(),
  isrc: z.string().nullable(),
  versionLabel: z.string().nullable(),
  audioUrl: z.string().nullable(),
  dawProjectUrl: z.string().nullable(),
  recordedAt: z.coerce.date().nullable(),
});

export type Recording = z.infer<typeof RecordingSchema>;

export const CreateRecordingSchema = z.object({
  workId: z.string().uuid(),
  isrc: z.string().optional().nullable(),
  versionLabel: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  dawProjectUrl: z.string().optional().nullable(),
  recordedAt: z.coerce.date().optional().nullable(),
});

export type CreateRecordingInput = z.infer<typeof CreateRecordingSchema>;

export const UpdateRecordingSchema = CreateRecordingSchema.omit({ workId: true }).partial();
export type UpdateRecordingInput = z.infer<typeof UpdateRecordingSchema>;
