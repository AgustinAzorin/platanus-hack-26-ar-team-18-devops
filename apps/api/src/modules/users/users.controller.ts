import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  type AuthenticatedUser,
  SupabaseAuthGuard,
} from '../../common/guards/supabase-auth.guard';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UserModel } from './users.model';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Return the profile for the authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserModel> {
    return this.users.getById(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List users (paginated)' })
  list(
    @Query('take') take = '20',
    @Query('skip') skip = '0',
  ): Promise<UserModel[]> {
    return this.users.list({
      take: Math.min(parseInt(take, 10) || 20, 100),
      skip: Math.max(parseInt(skip, 10) || 0, 0),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<UserModel> {
    return this.users.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user profile (id must match auth.users.id)' })
  create(@Body() body: CreateUserDto): Promise<UserModel> {
    return this.users.create(body);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUserDto,
  ): Promise<UserModel> {
    return this.users.update(user.id, body);
  }
}
