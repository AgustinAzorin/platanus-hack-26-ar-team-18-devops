import { CreateWorkContributorSchema } from '@repo/types/works';
import { createZodDto } from 'nestjs-zod';

export class CreateWorkContributorDto extends createZodDto(CreateWorkContributorSchema) {}
