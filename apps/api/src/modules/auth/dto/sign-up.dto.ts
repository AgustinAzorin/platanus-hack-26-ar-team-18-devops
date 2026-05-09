import { SignUpSchema } from '@repo/types';
import { createZodDto } from 'nestjs-zod';

export class SignUpDto extends createZodDto(SignUpSchema) {}
