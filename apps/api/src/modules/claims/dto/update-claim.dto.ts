import { UpdateClaimSchema } from '@repo/types/claims';
import { createZodDto } from 'nestjs-zod';

export class UpdateClaimDto extends createZodDto(UpdateClaimSchema) {}
