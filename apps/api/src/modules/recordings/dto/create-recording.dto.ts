import { CreateRecordingSchema } from '@repo/types/recordings';
import { createZodDto } from 'nestjs-zod';

export class CreateRecordingDto extends createZodDto(CreateRecordingSchema) {}
