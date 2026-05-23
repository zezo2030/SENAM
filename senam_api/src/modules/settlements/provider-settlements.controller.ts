import {
  Controller,
  Get,
  Param,
  Res,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { SettlementsService } from './settlements.service.js';
import { StatementService } from './statement.service.js';

@ApiTags('provider-settlements')
@ApiBearerAuth()
@Roles('provider_owner')
@Controller('provider/me/settlements')
export class ProviderSettlementsController {
  constructor(
    private readonly settlementsService: SettlementsService,
    private readonly statementService: StatementService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List settlements for the authenticated provider's company" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const companyId = user.companyId!;
    return this.settlementsService.listForCompany(companyId, Number(page), Number(limit));
  }

  @Get(':id/statement.pdf')
  @ApiOperation({ summary: 'Download the PDF statement for a settlement' })
  async downloadStatement(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    return this.statementService.streamPdf(id, user.companyId!, res);
  }
}
