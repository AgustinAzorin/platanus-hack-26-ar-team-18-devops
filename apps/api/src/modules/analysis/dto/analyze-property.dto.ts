import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AnalyzePropertySchema = z.object({
  neighborhood: z.string().min(1, 'neighborhood is required').trim(),
});

export class AnalyzePropertyDto extends createZodDto(AnalyzePropertySchema) {}
