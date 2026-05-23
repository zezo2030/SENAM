import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity.js';
import { AddressEntity } from './entities/address.entity.js';
import { FavoriteEntity } from './entities/favorite.entity.js';
import { UsersService } from './users.service.js';
import { AddressesService } from './addresses.service.js';
import { FavoritesService } from './favorites.service.js';
import { UsersController } from './users.controller.js';
import { AddressesController } from './addresses.controller.js';
import { FavoritesController } from './favorites.controller.js';
import { UploadsController } from './uploads.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AddressEntity, FavoriteEntity]),
  ],
  controllers: [UsersController, AddressesController, FavoritesController, UploadsController],
  providers: [UsersService, AddressesService, FavoritesService],
  exports: [UsersService],
})
export class UsersModule {}
