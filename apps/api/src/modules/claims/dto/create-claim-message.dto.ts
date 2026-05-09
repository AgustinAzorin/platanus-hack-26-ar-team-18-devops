import { CreateClaimMessageSchema } from '@repo/types/claims';
import { createZodDto } from 'nestjs-zod';

export class CreateClaimMessageDto extends createZodDto(CreateClaimMessageSchema) {}
