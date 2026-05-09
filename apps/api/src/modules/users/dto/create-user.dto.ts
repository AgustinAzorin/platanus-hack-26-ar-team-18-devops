import { CreateUserSchema } from '@repo/types';
import { createZodDto } from 'nestjs-zod';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
