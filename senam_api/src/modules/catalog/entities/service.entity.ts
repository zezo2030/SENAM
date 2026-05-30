import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CategoryEntity } from './category.entity.js';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => CategoryEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: CategoryEntity;

  @Column({ type: 'citext', unique: true })
  slug!: string;

  @Column({ name: 'name_ar', type: 'text' })
  nameAr!: string;

  @Column({ name: 'name_en', type: 'text', nullable: true })
  nameEn!: string | null;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr!: string | null;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn!: string | null;

  @Column({ name: 'icon_key', type: 'text', nullable: true })
  iconKey!: string | null;

  @Column({ name: 'image_key', type: 'text', nullable: true })
  imageKey!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
