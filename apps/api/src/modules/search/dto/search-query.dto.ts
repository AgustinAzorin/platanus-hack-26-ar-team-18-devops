import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'query is required').max(500).trim(),
});

export class SearchQueryDto extends createZodDto(SearchQuerySchema) {}
