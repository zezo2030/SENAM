import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('addresses')
@ApiBearerAuth()
@Controller('me/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @ApiOperation({ summary: 'List all addresses for the current user' })
  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.addressesService.findAll(user.sub);
  }

  @ApiOperation({ summary: 'Create a new address' })
  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get a specific address' })
  @Get(':id')
  findOne(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.addressesService.findOne(user.sub, id);
  }

  @ApiOperation({ summary: 'Update a specific address' })
  @Patch(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Delete a specific address' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    await this.addressesService.remove(user.sub, id);
  }

  @ApiOperation({ summary: 'Set an address as the default' })
  @Post(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    await this.addressesService.setDefault(user.sub, id);
  }
}
