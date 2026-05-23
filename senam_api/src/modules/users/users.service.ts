import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserEntity } from './entities/user.entity.js';
import { UpdateMeDto } from './dto/update-me.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getMe(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('user_not_found');
    }
    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UserEntity> {
    const user = await this.getMe(userId);

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    if (dto.locale !== undefined) {
      user.locale = dto.locale;
    }

    return this.userRepository.save(user);
  }

  async deleteMe(userId: string): Promise<void> {
    const user = await this.getMe(userId);

    const hash = crypto
      .createHash('sha256')
      .update(user.email)
      .digest('hex')
      .slice(0, 16);

    user.email = `deleted-${hash}@deleted` as unknown as string;
    user.displayName = null;
    user.phone = null;
    user.status = 'deleted';
    user.deletedAt = new Date();

    await this.userRepository.save(user);
  }
}
