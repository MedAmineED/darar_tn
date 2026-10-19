import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../../config/app-config.service';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { AccessTokenPayload } from '../auth.constants';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: AppConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtAccess.secret,
    });
  }

  /**
   * Runs on every authenticated request. Roles/permissions are resolved from
   * the database here so access changes take effect immediately.
   */
  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.buildAuthenticatedUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        message: 'User is no longer active',
        code: 'USER_INACTIVE',
      });
    }
    return user;
  }
}
