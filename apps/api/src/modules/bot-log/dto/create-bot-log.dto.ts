import { CreateBotLogSchema } from '@repo/types/bot-log';
import { createZodDto } from 'nestjs-zod';

export class CreateBotLogDto extends createZodDto(CreateBotLogSchema) {}
