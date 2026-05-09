import { z } from 'zod';

export const ArtistSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  ipiNumber: z.string().max(50).nullable(),
  email: z.string().email().nullable(),
  phone: z.string().max(50).nullable(),
  createdAt: z.coerce.date(),
});

export type Artist = z.infer<typeof ArtistSchema>;

export const CreateArtistSchema = z.object({
  name: z.string().min(1).max(200),
  ipiNumber: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
});

export type CreateArtistInput = z.infer<typeof CreateArtistSchema>;

export const UpdateArtistSchema = CreateArtistSchema.partial();
export type UpdateArtistInput = z.infer<typeof UpdateArtistSchema>;
