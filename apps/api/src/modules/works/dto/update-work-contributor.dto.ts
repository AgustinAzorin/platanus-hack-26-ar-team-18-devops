import { UpdateWorkContributorSchema } from '@repo/types/works';
import { createZodDto } from 'nestjs-zod';

export class UpdateWorkContributorDto extends createZodDto(UpdateWorkContributorSchema) {}
