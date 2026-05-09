import { CreateWorkSchema } from '@repo/types/works';
import { createZodDto } from 'nestjs-zod';

export class CreateWorkDto extends createZodDto(CreateWorkSchema) {}
