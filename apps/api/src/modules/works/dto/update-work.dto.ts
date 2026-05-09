import { UpdateWorkSchema } from '@repo/types/works';
import { createZodDto } from 'nestjs-zod';

export class UpdateWorkDto extends createZodDto(UpdateWorkSchema) {}
