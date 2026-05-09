import { UpdateUserSchema } from '@repo/types';
import { createZodDto } from 'nestjs-zod';

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
