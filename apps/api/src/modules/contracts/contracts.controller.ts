import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import type { ContractModel } from './contracts.model';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get()
  @ApiOperation({ summary: 'List contracts (paginated, optional workId filter)' })
  list(
    @Query('take') take = '20',
    @Query('skip') skip = '0',
    @Query('workId') workId?: string,
  ): Promise<ContractModel[]> {
    return this.contracts.list({
      take: Math.min(parseInt(take, 10) || 20, 100),
      skip: Math.max(parseInt(skip, 10) || 0, 0),
      workId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contract by id' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<ContractModel> {
    return this.contracts.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a contract' })
  create(@Body() body: CreateContractDto): Promise<ContractModel> {
    return this.contracts.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contract' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateContractDto,
  ): Promise<ContractModel> {
    return this.contracts.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contract' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.contracts.delete(id);
  }
}
