import { Injectable } from '@nestjs/common';
import type { CreateBotLogInput } from '@repo/types/bot-log';

import { toApi, type BotLogModel } from './bot-log.model';
import { BotLogRepository } from './bot-log.repository';

@Injectable()
export class BotLogService {
  constructor(private readonly repo: BotLogRepository) {}

  async list(params: { take: number; skip: number; kind?: string }): Promise<BotLogModel[]> {
    const rows = await this.repo.list(params);
    return rows.map(toApi);
  }

  async create(input: CreateBotLogInput): Promise<BotLogModel> {
    const row = await this.repo.create(input);
    return toApi(row);
  }
}
