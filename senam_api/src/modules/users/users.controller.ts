import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateMeDto } from './dto/update-me.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @Get()
  getMe(@CurrentUser() user: { sub: string }) {
    return this.usersService.getMe(user.sub);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @Patch()
  updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateMeDto,
  ) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @ApiOperation({ summary: 'Delete (anonymise) current user account' })
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() user: { sub: string }) {
    await this.usersService.deleteMe(user.sub);
  }
}
