import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { CompaniesService } from './companies.service.js';
import { GalleryService } from './gallery.service.js';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto.js';
import { UpdateProviderServicesDto } from './dto/update-provider-services.dto.js';
import {
  SetMediaObjectKeyDto,
  UpsertGalleryCategoryDto,
  CreateGalleryPhotoDto,
  UpdateGalleryPhotoDto,
  ReorderGalleryPhotosDto,
} from './dto/gallery.dto.js';

/**
 * Company-owner-facing API. Backs the "Company Dashboard" the owner uses to
 * edit their public page on the mobile app: identity, media (logo / cover),
 * contacts, features, and the portfolio gallery.
 *
 * Upload flow: the owner first calls `POST /uploads/presign` (purposes
 * `company_logo`, `company_cover`, `gallery_photo`) to get a signed PUT URL,
 * uploads the bytes there, then POSTs the resulting object key here.
 */
@ApiTags('provider-company')
@ApiBearerAuth()
@Roles('provider_owner')
@Controller('provider/me/company')
export class ProviderSelfController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly galleryService: GalleryService,
  ) {}

  // ── Identity / contacts / features ─────────────────────────────────────

  @Get()
  @ApiOperation({ summary: "Get the authenticated provider's company detail" })
  getMyCompany(@CurrentUser() user: JwtPayload) {
    return this.companiesService.getMyCompanyDetail(user.companyId!);
  }

  @Patch()
  @ApiOperation({ summary: "Update identity, contacts, location, and features" })
  updateMyCompany(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.companiesService.updateProviderProfile(user.companyId!, dto);
  }

  @Get('services')
  @ApiOperation({ summary: "List catalog services with this provider's selections" })
  listMyServices(@CurrentUser() user: JwtPayload) {
    return this.companiesService.getProviderServiceSelection(user.companyId!);
  }

  @Patch('services')
  @ApiOperation({ summary: 'Replace selected catalog services for this provider' })
  updateMyServices(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProviderServicesDto,
  ) {
    return this.companiesService.updateProviderServices(
      user.companyId!,
      dto.serviceIds,
    );
  }

  // ── Media ──────────────────────────────────────────────────────────────

  @Patch('logo')
  @ApiOperation({ summary: 'Set the logo from an uploaded object key' })
  setLogo(@CurrentUser() user: JwtPayload, @Body() dto: SetMediaObjectKeyDto) {
    return this.companiesService.setLogo(user.companyId!, dto.objectKey);
  }

  @Patch('cover')
  @ApiOperation({ summary: 'Set the cover image from an uploaded object key' })
  setCover(@CurrentUser() user: JwtPayload, @Body() dto: SetMediaObjectKeyDto) {
    return this.companiesService.setCover(user.companyId!, dto.objectKey);
  }

  // ── Gallery categories ─────────────────────────────────────────────────

  @Get('gallery/categories')
  @ApiOperation({ summary: 'List gallery categories (filter pills)' })
  listCategories(@CurrentUser() user: JwtPayload) {
    return this.galleryService.listCategories(user.companyId!);
  }

  @Post('gallery/categories')
  @ApiOperation({ summary: 'Create a gallery category' })
  createCategory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertGalleryCategoryDto,
  ) {
    return this.galleryService.createCategory(user.companyId!, dto);
  }

  @Patch('gallery/categories/:id')
  @ApiOperation({ summary: 'Update a gallery category' })
  updateCategory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertGalleryCategoryDto,
  ) {
    return this.galleryService.updateCategory(user.companyId!, id, dto);
  }

  @Delete('gallery/categories/:id')
  @ApiOperation({
    summary:
      "Delete a category; its photos are moved to 'uncategorized' (not deleted)",
  })
  async deleteCategory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.galleryService.deleteCategory(user.companyId!, id);
    return { ok: true };
  }

  // ── Gallery photos ─────────────────────────────────────────────────────

  @Get('gallery/photos')
  @ApiOperation({
    summary: "List gallery photos; optional ?categoryId=<uuid|null>",
  })
  listPhotos(
    @CurrentUser() user: JwtPayload,
    @Query('categoryId') categoryId?: string,
  ) {
    const filter =
      categoryId === undefined ? undefined : categoryId === 'null' ? null : categoryId;
    return this.galleryService.listPhotos(user.companyId!, filter);
  }

  @Post('gallery/photos')
  @ApiOperation({ summary: 'Attach an uploaded photo to the gallery' })
  createPhoto(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGalleryPhotoDto,
  ) {
    return this.galleryService.createPhoto(user.companyId!, dto);
  }

  @Patch('gallery/photos/reorder')
  @ApiOperation({ summary: 'Update sort_order for many photos at once' })
  async reorderPhotos(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReorderGalleryPhotosDto,
  ) {
    await this.galleryService.reorderPhotos(user.companyId!, dto);
    return { ok: true };
  }

  @Patch('gallery/photos/:id')
  @ApiOperation({ summary: 'Edit caption / category / sort_order of a photo' })
  updatePhoto(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryPhotoDto,
  ) {
    return this.galleryService.updatePhoto(user.companyId!, id, dto);
  }

  @Delete('gallery/photos/:id')
  @ApiOperation({ summary: 'Delete a gallery photo' })
  async deletePhoto(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.galleryService.deletePhoto(user.companyId!, id);
    return { ok: true };
  }
}
