import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service.js';
import { AddFavoriteDto } from './dto/add-favorite.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('me/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiOperation({ summary: 'List all favorited companies for the current user' })
  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.favoritesService.findAll(user.sub);
  }

  @ApiOperation({ summary: 'Add a company to favorites' })
  @Post()
  add(
    @CurrentUser() user: { sub: string },
    @Body() dto: AddFavoriteDto,
  ) {
    return this.favoritesService.add(user.sub, dto.companyId);
  }

  @ApiOperation({ summary: 'Remove a company from favorites' })
  @Delete(':companyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: { sub: string },
    @Param('companyId') companyId: string,
  ) {
    await this.favoritesService.remove(user.sub, companyId);
  }
}
