import { UpdateContractSchema } from '@repo/types/contracts';
import { createZodDto } from 'nestjs-zod';

export class UpdateContractDto extends createZodDto(UpdateContractSchema) {}
