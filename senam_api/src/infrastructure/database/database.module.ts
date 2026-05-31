import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL')!,
        synchronize: false,
        logging: config.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
        migrationsTableName: 'migrations',
        // SSL is opt-in via DB_SSL (managed cloud DBs), not tied to NODE_ENV:
        // a self-hosted Postgres (e.g. the bundled compose container) has no SSL.
        ssl:
          config.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
