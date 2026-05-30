import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity.js';
import { CategoryEntity } from './entities/category.entity.js';

interface FindAllFilter {
  categoryId?: string | undefined;
  categorySlug?: string | undefined;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  async findAll(filter: FindAllFilter = {}): Promise<ServiceEntity[]> {
    let categoryId = filter.categoryId;
    if (!categoryId && filter.categorySlug) {
      const cat = await this.categoryRepo.findOne({
        where: { slug: filter.categorySlug },
      });
      if (!cat) return [];
      categoryId = cat.id;
    }

    const where: Record<string, unknown> = { isActive: true };
    if (categoryId) {
      where['categoryId'] = categoryId;
    }
    return this.serviceRepo.find({ where, order: { nameAr: 'ASC' } });
  }
}
