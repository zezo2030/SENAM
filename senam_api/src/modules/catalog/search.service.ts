import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity.js';
import { CompanyEntity } from '../companies/entities/company.entity.js';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
  ) {}

  async search(
    q: string,
    categoryId?: string,
  ): Promise<{ services: ServiceEntity[]; companies: CompanyEntity[] }> {
    const likeQ = `%${q}%`;

    const serviceQb = this.serviceRepo
      .createQueryBuilder('s')
      .where('s.is_active = true')
      .andWhere(
        '(s.name_ar ILIKE :q OR s.name_en ILIKE :q OR s.description_ar ILIKE :q)',
        { q: likeQ },
      );

    if (categoryId) {
      serviceQb.andWhere('s.category_id = :categoryId', { categoryId });
    }

    const companyQb = this.companyRepo
      .createQueryBuilder('c')
      .where("c.status = 'active'")
      .andWhere(
        '(c.display_name ILIKE :q OR c.legal_name ILIKE :q OR c.description ILIKE :q)',
        { q: likeQ },
      );

    const [services, companies] = await Promise.all([
      serviceQb.getMany(),
      companyQb.getMany(),
    ]);

    return { services, companies };
  }
}
