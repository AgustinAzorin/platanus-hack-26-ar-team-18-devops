import { z } from 'zod';

export const WorkContributorSchema = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid(),
  artistId: z.string().uuid(),
  role: z.string(),
  splitPercentage: z.number(),
});

export type WorkContributor = z.infer<typeof WorkContributorSchema>;

export const WorkSchema = z.object({
  id: z.string().uuid(),
  artistId: z.string().uuid(),
  title: z.string().min(1).max(500),
  iswc: z.string().nullable(),
  genre: z.string().nullable(),
  lyrics: z.string().nullable(),
  durationSec: z.number().int().nullable(),
  creationDate: z.coerce.date().nullable(),
  registeredAt: z.coerce.date(),
});

export type Work = z.infer<typeof WorkSchema>;

export const CreateWorkSchema = z.object({
  artistId: z.string().uuid(),
  title: z.string().min(1).max(500),
  iswc: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  lyrics: z.string().optional().nullable(),
  durationSec: z.number().int().optional().nullable(),
  creationDate: z.coerce.date().optional().nullable(),
});

export type CreateWorkInput = z.infer<typeof CreateWorkSchema>;

export const UpdateWorkSchema = CreateWorkSchema.omit({ artistId: true }).partial();
export type UpdateWorkInput = z.infer<typeof UpdateWorkSchema>;

export const CreateWorkContributorSchema = z.object({
  workId: z.string().uuid(),
  artistId: z.string().uuid(),
  role: z.string().min(1),
  splitPercentage: z.number().min(0).max(100),
});

export type CreateWorkContributorInput = z.infer<typeof CreateWorkContributorSchema>;

export const UpdateWorkContributorSchema = z.object({
  role: z.string().min(1).optional(),
  splitPercentage: z.number().min(0).max(100).optional(),
});

export type UpdateWorkContributorInput = z.infer<typeof UpdateWorkContributorSchema>;
