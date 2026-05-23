import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL']!,
  synchronize: false,
  logging: process.env['NODE_ENV'] !== 'production',
  entities: [path.join(__dirname, '../../modules/**/*.entity.js')],
  migrations: [path.join(__dirname, '../../migrations/*.js')],
  migrationsTableName: 'migrations',
});
