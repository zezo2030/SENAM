import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyUserEntity } from './company-user.entity.js';

/**
 * Registers the CompanyUserEntity so other modules (Auth, Admin) can read
 * the owner login row. Staff management endpoints were removed when SENAM
 * became a directory-only app.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CompanyUserEntity])],
})
export class CompanyUsersModule {}
