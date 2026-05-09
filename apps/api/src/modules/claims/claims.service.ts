import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateClaimInput,
  UpdateClaimInput,
  CreateClaimMessageInput,
} from '@repo/types/claims';

import { toApi, messageToApi, type ClaimModel, type ClaimMessageModel } from './claims.model';
import { ClaimsRepository } from './claims.repository';

@Injectable()
export class ClaimsService {
  constructor(private readonly repo: ClaimsRepository) {}

  async getById(id: string): Promise<ClaimModel> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`Claim ${id} not found`);
    return toApi(row);
  }

  async list(params: {
    take: number;
    skip: number;
    status?: string;
    workId?: string;
  }): Promise<ClaimModel[]> {
    const rows = await this.repo.list(params);
    return rows.map(toApi);
  }

  async create(input: CreateClaimInput): Promise<ClaimModel> {
    const row = await this.repo.create(input);
    return toApi(row);
  }

  async update(id: string, input: UpdateClaimInput): Promise<ClaimModel> {
    await this.getById(id);
    const row = await this.repo.update(id, input);
    return toApi(row);
  }

  async listMessages(claimId: string): Promise<ClaimMessageModel[]> {
    await this.getById(claimId);
    const rows = await this.repo.listMessages(claimId);
    return rows.map(messageToApi);
  }

  async createMessage(input: CreateClaimMessageInput): Promise<ClaimMessageModel> {
    await this.getById(input.claimId);
    const row = await this.repo.createMessage(input);
    return messageToApi(row);
  }
}
