import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { AppConfigService } from '../../config/app-config.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { toAuthenticatedUser } from '../users/user.mapper';
import { UsersRepository, UserWithRoles } from '../users/users.repository';
import { durationToMs, RefreshTokenPayload } from './auth.constants';
import { ChangePasswordDto } from './dto/change-password.dto';

const BCRYPT_ROUNDS = 12;

export interface AuthSession {
  accessToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async login(
    email: string,
    password: string,
    res: Response,
  ): Promise<AuthSession> {
    const user = await this.validateCredentials(email, password);
    await this.usersRepository.touchLastLogin(user.id);
    return this.issueSession(user, res);
  }

  async refresh(
    rawToken: string | undefined,
    res: Response,
  ): Promise<AuthSession> {
    if (!rawToken) {
      throw new UnauthorizedException({
        message: 'Missing refresh token',
        code: 'REFRESH_TOKEN_MISSING',
      });
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        rawToken,
        { secret: this.config.jwtRefresh.secret },
      );
    } catch {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        code: 'REFRESH_TOKEN_INVALID',
      });
    }

    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException({
        message: 'Refresh token is no longer valid',
        code: 'REFRESH_TOKEN_REVOKED',
      });
    }

    // Rotate: revoke the presented token before issuing a new one.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException({
        message: 'User is no longer active',
        code: 'USER_INACTIVE',
      });
    }

    return this.issueSession(user, res);
  }

  async logout(
    rawToken: string | undefined,
    res: Response,
  ): Promise<{ loggedOut: true }> {
    if (rawToken) {
      const tokenHash = this.hashToken(rawToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.clearRefreshCookie(res);
    return { loggedOut: true };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new BadRequestException({
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD',
      });
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersRepository.updatePassword(userId, passwordHash);
    // Invalidate every existing session for this user.
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async buildAuthenticatedUser(
    userId: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.isActive) {
      return null;
    }
    return toAuthenticatedUser(user);
  }

  private async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserWithRoles> {
    const user = await this.usersRepository.findByEmail(email);
    const invalid = new UnauthorizedException({
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
    });
    if (!user || !user.isActive) {
      // Still run a comparison to reduce timing side-channels.
      await bcrypt.compare(password, '$2b$12$invalidinvalidinvalidinvalidinva');
      throw invalid;
    }
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw invalid;
    }
    return user;
  }

  private async issueSession(
    user: UserWithRoles,
    res: Response,
  ): Promise<AuthSession> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.jwtAccess.secret,
        expiresIn: this.config.jwtAccess.expiresIn,
      },
    );

    const jti = randomUUID();
    const expiresAt = new Date(
      Date.now() + durationToMs(this.config.jwtRefresh.expiresIn),
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti },
      {
        secret: this.config.jwtRefresh.secret,
        expiresIn: this.config.jwtRefresh.expiresIn,
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    this.setRefreshCookie(res, refreshToken, expiresAt);
    return { accessToken, user: toAuthenticatedUser(user) };
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private cookiePath(): string {
    return `/${this.config.apiPrefix}/auth`.replace(/\/+/g, '/');
  }

  private setRefreshCookie(
    res: Response,
    token: string,
    expiresAt: Date,
  ): void {
    const cookie = this.config.refreshCookie;
    res.cookie(cookie.name, token, {
      httpOnly: true,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      domain: cookie.domain,
      path: this.cookiePath(),
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const cookie = this.config.refreshCookie;
    res.clearCookie(cookie.name, {
      httpOnly: true,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      domain: cookie.domain,
      path: this.cookiePath(),
    });
  }
}
