import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AnalyzePropertySchema = z
  .object({
    neighborhood: z.string().trim().min(1).optional(),
    posting_id: z.string().trim().min(1).optional(),
  })
  .refine((v) => Boolean(v.neighborhood) || Boolean(v.posting_id), {
    message: 'Either neighborhood or posting_id is required',
  });

export class AnalyzePropertyDto extends createZodDto(AnalyzePropertySchema) {}
