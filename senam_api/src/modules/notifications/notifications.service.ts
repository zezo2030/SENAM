import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async findForUser(
    userId: string,
    userKind: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: NotificationEntity[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    const [data, total] = await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.user_kind = :userKind', { userKind })
      .orderBy('CASE WHEN n.read_at IS NULL THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('n.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async markRead(
    notificationId: string,
    userId: string,
    userKind: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId, userKind },
    });

    if (!notification) {
      throw new NotFoundException('notification_not_found');
    }

    if (notification.readAt) {
      throw new ConflictException('notification_already_read');
    }

    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }
}
