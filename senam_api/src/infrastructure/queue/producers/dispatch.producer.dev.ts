import { Injectable, Logger } from '@nestjs/common';
import type { AcceptTimeoutJobData } from './dispatch.producer.js';

@Injectable()
export class DispatchProducerDev {
  private readonly logger = new Logger(DispatchProducerDev.name);

  async enqueueAcceptTimeout(data: AcceptTimeoutJobData, delayMs: number): Promise<void> {
    this.logger.warn(
      `Redis disabled: skipped dispatch accept-timeout for order ${data.orderId} (delay ${delayMs}ms)`,
    );
  }

  async removeAcceptTimeout(_orderId: string, _attempt: number): Promise<void> {}
}
