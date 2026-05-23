import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { AuditSearchController } from './audit-search.controller.js';

@Global()
@Module({
  controllers: [AuditSearchController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
