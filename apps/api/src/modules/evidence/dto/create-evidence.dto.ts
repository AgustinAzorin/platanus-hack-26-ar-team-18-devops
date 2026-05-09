import { CreateEvidenceSchema } from '@repo/types/evidence';
import { createZodDto } from 'nestjs-zod';

export class CreateEvidenceDto extends createZodDto(CreateEvidenceSchema) {}
