import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity.js';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
  ) {}

  findAll(categoryId?: string): Promise<ServiceEntity[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (categoryId) {
      where['categoryId'] = categoryId;
    }
    return this.serviceRepo.find({ where, order: { nameAr: 'ASC' } });
  }
}
