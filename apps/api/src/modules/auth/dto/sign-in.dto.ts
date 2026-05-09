import { SignInSchema } from '@repo/types';
import { createZodDto } from 'nestjs-zod';

export class SignInDto extends createZodDto(SignInSchema) {}
