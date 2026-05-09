import { z } from 'zod';

export const ContractSchema = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid(),
  partyName: z.string(),
  contractType: z.string(),
  fileUrl: z.string(),
  signedAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date().nullable(),
});

export type Contract = z.infer<typeof ContractSchema>;

export const CreateContractSchema = z.object({
  workId: z.string().uuid(),
  partyName: z.string().min(1),
  contractType: z.string().min(1),
  fileUrl: z.string().min(1),
  signedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type CreateContractInput = z.infer<typeof CreateContractSchema>;

export const UpdateContractSchema = CreateContractSchema.omit({ workId: true }).partial();
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;
