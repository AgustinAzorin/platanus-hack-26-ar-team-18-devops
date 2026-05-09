import { RefreshTokenSchema } from '@repo/types';
import { createZodDto } from 'nestjs-zod';

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
