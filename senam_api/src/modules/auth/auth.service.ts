import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpService } from './otp.service.js';
import { TokensService } from './tokens.service.js';
import { UserEntity } from '../users/entities/user.entity.js';

const PASSWORD_BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly tokensService: TokensService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async requestOtp(email: string, principal: string, locale = 'ar'): Promise<void> {
    if (principal === 'customer') {
      const exists = await this.userRepository.findOne({ where: { email: email as unknown as string } });
      if (!exists) {
        const user = this.userRepository.create({ email: email as unknown as string, locale });
        await this.userRepository.save(user);
      }
    } else if (principal === 'admin') {
      const rows = await this.dataSource.query(
        `SELECT id FROM admin_users WHERE email = $1 AND status = 'active'`,
        [email],
      ) as Array<{ id: string }>;
      if (!rows.length) throw new UnauthorizedException('admin_not_found');
    }
    await this.otpService.sendOtp(email, locale);
  }

  async verifyOtp(
    email: string,
    code: string,
    principal: 'customer' | 'provider' | 'admin',
  ): Promise<{ accessToken: string; refreshToken: string }> {
    await this.otpService.verifyOtp(email, code);

    if (principal === 'customer') {
      const user = await this.userRepository.findOne({ where: { email: email as unknown as string } });
      if (!user || user.status === 'banned' || user.status === 'deleted') {
        throw new UnauthorizedException('account_not_accessible');
      }

      if (!user.emailVerifiedAt) {
        await this.userRepository.update(user.id, { emailVerifiedAt: new Date() });
      }

      return this.tokensService.issueTokenPair({ sub: user.id, principal, roles: [] });
    } else if (principal === 'admin') {
      const admins = await this.dataSource.query(
        `SELECT id, status FROM admin_users WHERE email = $1`,
        [email],
      ) as Array<{ id: string; status: string }>;
      const admin = admins[0];
      if (!admin || admin.status !== 'active') throw new UnauthorizedException('account_not_accessible');

      const roles = await this.dataSource.query(
        `SELECT r.slug FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.admin_user_id = $1`,
        [admin.id],
      ) as Array<{ slug: string }>;

      return this.tokensService.issueTokenPair({
        sub: admin.id,
        principal: 'admin',
        roles: roles.map(r => r.slug),
      });
    } else {
      throw new UnauthorizedException('principal_not_supported');
    }
  }

  async registerCustomer(input: {
    email: string;
    password: string;
    displayName?: string | undefined;
    phone?: string | undefined;
    locale?: string | undefined;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing && existing.status !== 'deleted') {
      throw new ConflictException('email_already_registered');
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_BCRYPT_ROUNDS);

    let user: UserEntity;
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.status = 'active';
      existing.displayName = input.displayName ?? existing.displayName;
      existing.phone = input.phone ?? existing.phone;
      existing.locale = input.locale ?? existing.locale ?? 'ar';
      user = await this.userRepository.save(existing);
    } else {
      user = this.userRepository.create({
        email,
        passwordHash,
        displayName: input.displayName ?? null,
        phone: input.phone ?? null,
        locale: input.locale ?? 'ar',
      });
      user = await this.userRepository.save(user);
    }

    return this.tokensService.issueTokenPair({
      sub: user.id,
      principal: 'customer',
      roles: [],
    });
  }

  async loginWithPassword(
    email: string,
    password: string,
    principal: 'customer' | 'admin' | 'provider',
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (principal === 'customer') {
      const user = await this.userRepository
        .createQueryBuilder('u')
        .addSelect('u.passwordHash')
        .where('u.email = :email', { email: normalizedEmail })
        .getOne();

      if (
        !user ||
        !user.passwordHash ||
        user.status === 'banned' ||
        user.status === 'deleted'
      ) {
        throw new UnauthorizedException('invalid_credentials');
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('invalid_credentials');

      return this.tokensService.issueTokenPair({
        sub: user.id,
        principal: 'customer',
        roles: [],
      });
    }

    if (principal === 'admin') {
      const admins = await this.dataSource.query(
        `SELECT id, password_hash, status FROM admin_users WHERE email = $1`,
        [email],
      ) as Array<{ id: string; password_hash: string | null; status: string }>;
      const admin = admins[0];
      if (!admin || admin.status !== 'active' || !admin.password_hash) {
        throw new UnauthorizedException('invalid_credentials');
      }

      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) throw new UnauthorizedException('invalid_credentials');

      const roles = await this.dataSource.query(
        `SELECT r.slug FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.admin_user_id = $1`,
        [admin.id],
      ) as Array<{ slug: string }>;

      return this.tokensService.issueTokenPair({
        sub: admin.id,
        principal: 'admin',
        roles: roles.map((r) => r.slug),
      });
    }

    const users = await this.dataSource.query(
      `SELECT id, company_id, password_hash, status, role FROM company_users WHERE email = $1`,
      [email],
    ) as Array<{
      id: string;
      company_id: string;
      password_hash: string | null;
      status: string;
      role: string;
    }>;
    const user = users[0];
    if (!user || user.status !== 'active' || !user.password_hash) {
      throw new UnauthorizedException('invalid_credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('invalid_credentials');

    const providerRole = user.role === 'owner' ? 'provider_owner' : 'provider_staff';
    return this.tokensService.issueTokenPair({
      sub: user.id,
      principal: 'provider',
      roles: [providerRole],
      companyId: user.company_id,
    });
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.tokensService.rotateRefreshToken(refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokensService.revokeRefreshToken(refreshToken);
  }
}
