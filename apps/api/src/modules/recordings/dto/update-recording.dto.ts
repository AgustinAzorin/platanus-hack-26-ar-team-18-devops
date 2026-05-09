import { UpdateRecordingSchema } from '@repo/types/recordings';
import { createZodDto } from 'nestjs-zod';

export class UpdateRecordingDto extends createZodDto(UpdateRecordingSchema) {}
