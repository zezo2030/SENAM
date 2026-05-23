import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteEntity } from './entities/favorite.entity.js';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
  ) {}

  async findAll(userId: string): Promise<FavoriteEntity[]> {
    return this.favoriteRepository.find({ where: { userId } });
  }

  async add(userId: string, companyId: string): Promise<FavoriteEntity> {
    const existing = await this.favoriteRepository.findOne({
      where: { userId, companyId },
    });
    if (existing) {
      return existing;
    }

    const favorite = this.favoriteRepository.create({ userId, companyId });
    return this.favoriteRepository.save(favorite);
  }

  async remove(userId: string, companyId: string): Promise<void> {
    await this.favoriteRepository.delete({ userId, companyId });
  }
}
