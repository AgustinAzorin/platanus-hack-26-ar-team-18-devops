import { CreateClaimSchema } from '@repo/types/claims';
import { createZodDto } from 'nestjs-zod';

export class CreateClaimDto extends createZodDto(CreateClaimSchema) {}
