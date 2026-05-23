import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUserEntity } from './company-user.entity.js';
import { CreateCompanyUserDto } from './dto/create-company-user.dto.js';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto.js';

@Injectable()
export class CompanyUsersService {
  constructor(
    @InjectRepository(CompanyUserEntity)
    private readonly companyUserRepo: Repository<CompanyUserEntity>,
  ) {}

  async listStaff(companyId: string): Promise<CompanyUserEntity[]> {
    return this.companyUserRepo.find({
      where: { companyId },
      order: { createdAt: 'ASC' },
    });
  }

  async addStaff(
    companyId: string,
    dto: CreateCompanyUserDto,
  ): Promise<CompanyUserEntity> {
    const existing = await this.companyUserRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('email_already_in_use');
    }

    const staffMember = this.companyUserRepo.create({
      companyId,
      email: dto.email,
      displayName: dto.displayName ?? null,
      role: 'staff',
      status: 'active',
    });

    return this.companyUserRepo.save(staffMember);
  }

  async updateStaff(
    companyId: string,
    staffId: string,
    dto: UpdateCompanyUserDto,
  ): Promise<CompanyUserEntity> {
    const staffMember = await this.companyUserRepo.findOne({
      where: { id: staffId, companyId },
    });
    if (!staffMember) {
      throw new NotFoundException('staff_member_not_found');
    }

    if (dto.displayName !== undefined) {
      staffMember.displayName = dto.displayName;
    }
    if (dto.status !== undefined) {
      staffMember.status = dto.status;
    }

    return this.companyUserRepo.save(staffMember);
  }

  async removeStaff(companyId: string, staffId: string): Promise<void> {
    const staffMember = await this.companyUserRepo.findOne({
      where: { id: staffId, companyId },
    });
    if (!staffMember) {
      throw new NotFoundException('staff_member_not_found');
    }
    if (staffMember.role === 'owner') {
      throw new ForbiddenException('cannot_remove_owner');
    }

    await this.companyUserRepo.remove(staffMember);
  }

  async findByEmail(email: string): Promise<CompanyUserEntity | null> {
    return this.companyUserRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<CompanyUserEntity | null> {
    return this.companyUserRepo.findOne({ where: { id } });
  }
}
