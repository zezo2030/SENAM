import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator.js';
import { SearchService } from './search.service.js';
import { IsUuidLoose } from '../../common/decorators/is-uuid-loose.decorator.js';
class SearchQueryDto {
  @IsString()
  @MinLength(1)
  q!: string;

  @IsOptional()
  @IsUuidLoose()
  categoryId?: string;
}

@ApiTags('catalog')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search services and companies by name / description' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  async search(@Query() query: SearchQueryDto) {
    if (!query.q || query.q.trim().length === 0) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.searchService.search(query.q.trim(), query.categoryId);
  }
}
