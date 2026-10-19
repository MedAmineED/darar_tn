import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.validation';

/**
 * Type-safe accessor over the validated environment. Inject this instead of
 * the raw ConfigService so consumers never deal with `undefined`/`any`.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.get('PORT');
  }

  get apiPrefix(): string {
    return this.get('API_PREFIX');
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  get jwtAccess(): { secret: string; expiresIn: string } {
    return {
      secret: this.get('JWT_ACCESS_SECRET'),
      expiresIn: this.get('JWT_ACCESS_EXPIRES_IN'),
    };
  }

  get jwtRefresh(): { secret: string; expiresIn: string } {
    return {
      secret: this.get('JWT_REFRESH_SECRET'),
      expiresIn: this.get('JWT_REFRESH_EXPIRES_IN'),
    };
  }

  get refreshCookie(): {
    name: string;
    secure: boolean;
    domain: string | undefined;
    sameSite: 'lax' | 'strict' | 'none';
  } {
    const domain = this.get('COOKIE_DOMAIN');
    return {
      name: this.get('REFRESH_COOKIE_NAME'),
      secure: this.get('COOKIE_SECURE'),
      domain: domain === '' ? undefined : domain,
      sameSite: this.get('COOKIE_SAME_SITE'),
    };
  }

  get seedAdmin(): {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  } {
    return {
      email: this.get('SEED_ADMIN_EMAIL'),
      password: this.get('SEED_ADMIN_PASSWORD'),
      firstName: this.get('SEED_ADMIN_FIRST_NAME'),
      lastName: this.get('SEED_ADMIN_LAST_NAME'),
    };
  }

  get throttle(): { ttl: number; limit: number } {
    return {
      ttl: this.get('THROTTLE_TTL'),
      limit: this.get('THROTTLE_LIMIT'),
    };
  }

  get uploads(): { dir: string; maxBytes: number } {
    return {
      dir: this.get('UPLOADS_DIR'),
      maxBytes: this.get('MAX_UPLOAD_MB') * 1024 * 1024,
    };
  }
}
