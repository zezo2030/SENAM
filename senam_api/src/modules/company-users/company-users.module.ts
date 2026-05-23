import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyUserEntity } from './company-user.entity.js';
import { CompanyUsersService } from './company-users.service.js';
import { CompanyUsersController } from './company-users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyUserEntity])],
  controllers: [CompanyUsersController],
  providers: [CompanyUsersService],
  exports: [CompanyUsersService],
})
export class CompanyUsersModule {}
