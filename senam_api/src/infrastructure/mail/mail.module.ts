import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailPort } from './mail.port.js';
import { SesMailAdapter } from './ses.adapter.js';
import { MailhogMailAdapter } from './mailhog.adapter.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MailPort,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (config.get<string>('NODE_ENV') === 'production') {
          return new SesMailAdapter(config);
        }
        return new MailhogMailAdapter(config);
      },
    },
  ],
  exports: [MailPort],
})
export class MailModule {}
