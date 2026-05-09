import type { BotLog as PrismaBotLog } from '@repo/database';
import type { BotLog as ApiBotLog } from '@repo/types/bot-log';

export type BotLogModel = ApiBotLog;

export function toApi(row: PrismaBotLog): BotLogModel {
  return {
    id: row.id,
    kind: row.kind,
    text: row.text,
    createdAt: row.createdAt,
  };
}
