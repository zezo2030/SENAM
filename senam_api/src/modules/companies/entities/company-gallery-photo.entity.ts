import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('company_gallery_photos')
@Index('ix_company_gallery_photos_company_cat_sort', ['companyId', 'categoryId', 'sortOrder'])
export class CompanyGalleryPhotoEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @Column({ name: 'object_key', type: 'text' })
  objectKey!: string;

  @Column({ name: 'caption_ar', type: 'text', nullable: true })
  captionAr!: string | null;

  @Column({ name: 'caption_en', type: 'text', nullable: true })
  captionEn!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
