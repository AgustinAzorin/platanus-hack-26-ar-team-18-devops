import { CreateContractSchema } from '@repo/types/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateContractDto extends createZodDto(CreateContractSchema) {}
