import { Injectable } from '@nestjs/common';

@Injectable()
export class CancelPolicyService {
  compute(
    status: string,
    total: number,
    acceptedAt: Date | null,
    now?: Date,
  ): { feeAmount: number; refundAmount: number; canCancel: boolean } {
    const effectiveNow = now ?? new Date();

    if (status === 'pending') {
      return { canCancel: true, feeAmount: 0, refundAmount: total };
    }

    if (status === 'accepted') {
      if (acceptedAt === null) {
        return { canCancel: true, feeAmount: 0, refundAmount: total };
      }
      const msElapsed = effectiveNow.getTime() - new Date(acceptedAt).getTime();
      if (msElapsed < 60 * 60 * 1000) {
        return { canCancel: true, feeAmount: 0, refundAmount: total };
      }
      const feeAmount = Math.round(total * 0.2);
      return { canCancel: true, feeAmount, refundAmount: total - feeAmount };
    }

    return { canCancel: false, feeAmount: total, refundAmount: 0 };
  }
}
