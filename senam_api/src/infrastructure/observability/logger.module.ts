import { Module, RequestMethod } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') !== 'production';
        return {
          forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }],
          pinoHttp: {
            level: config.get<string>('LOG_LEVEL', 'info'),
            ...(isDev
              ? {
                  transport: {
                    target: 'pino-pretty',
                    options: { colorize: true, singleLine: true },
                  },
                }
              : {}),
            redact: {
              paths: [
                'req.headers.authorization',
                '*.password',
                '*.card_number',
                '*.card_cvv',
                '*.card_expiry',
              ],
              censor: '[REDACTED]',
            },
            serializers: {
              req(req: { method: string; url: string }) {
                return { method: req.method, url: req.url };
              },
            },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class ObservabilityModule {}
