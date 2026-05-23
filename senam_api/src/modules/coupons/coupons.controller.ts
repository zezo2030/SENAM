import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service.js';
import { ValidateCouponDto } from './dto/validate-coupon.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon code and preview the discount' })
  async validateCoupon(
    @Body() dto: ValidateCouponDto,
    @CurrentUser() user: { sub: string },
  ): Promise<{
    valid: true;
    discountAmount: number;
    coupon: {
      code: string;
      kind: string;
      valueBpsOrAmount: number;
      minOrderAmount: number;
      validFrom: Date;
      validUntil: Date;
    };
  }> {
    const { discountAmount, coupon } = await this.couponsService.validate(
      dto.code,
      user.sub,
      dto.subtotal,
      dto.companyId,
      dto.categoryId,
    );

    return {
      valid: true,
      discountAmount,
      coupon: {
        code: coupon.code,
        kind: coupon.kind,
        valueBpsOrAmount: coupon.valueBpsOrAmount,
        minOrderAmount: coupon.minOrderAmount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
      },
    };
  }
}
