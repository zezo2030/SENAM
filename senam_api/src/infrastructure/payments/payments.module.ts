import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentPort } from './payment.port.js';
import { MyFatoorahPaymentAdapter } from './myfatoorah.adapter.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PaymentPort,
      useClass: MyFatoorahPaymentAdapter,
    },
  ],
  exports: [PaymentPort],
})
export class PaymentsInfraModule {}
