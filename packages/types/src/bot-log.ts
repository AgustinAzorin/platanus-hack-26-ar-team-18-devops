import { z } from 'zod';

export const BotLogSchema = z.object({
  id: z.string().uuid(),
  kind: z.string(),
  text: z.string(),
  createdAt: z.coerce.date(),
});

export type BotLog = z.infer<typeof BotLogSchema>;

export const CreateBotLogSchema = z.object({
  kind: z.string().min(1),
  text: z.string().min(1),
});

export type CreateBotLogInput = z.infer<typeof CreateBotLogSchema>;
