import { BadRequestException, Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { OtpRequestDto } from './dto/otp-request.dto.js';
import { OtpVerifyDto } from './dto/otp-verify.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new customer with email and password' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerCustomer({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
      phone: dto.phone,
      locale: dto.locale,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Sign in with email and password (customer/admin/provider)' })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithPassword(
      dto.email,
      dto.password,
      dto.principal ?? 'customer',
    );
  }

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Request an OTP code via email (admin dashboard only)' })
  async requestOtp(@Body() dto: OtpRequestDto) {
    const principal = dto.principal ?? 'customer';
    if (principal === 'customer') {
      throw new BadRequestException('otp_disabled_for_customer');
    }
    await this.authService.requestOtp(dto.email, principal);
    return { message: 'otp_sent' };
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and receive JWT pair (admin dashboard only)' })
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    const principal = dto.principal ?? 'customer';
    if (principal === 'customer') {
      throw new BadRequestException('otp_disabled_for_customer');
    }
    return this.authService.verifyOtp(dto.email, dto.code, principal);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
  }
}
