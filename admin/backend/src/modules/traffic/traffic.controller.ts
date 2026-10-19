import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  CollectDto,
  SessionQueryDto,
  TrafficQueryDto,
} from './dto/traffic.dto';
import { TrafficService } from './traffic.service';

@ApiTags('Traffic')
@Controller('traffic')
export class TrafficController {
  constructor(private readonly traffic: TrafficService) {}

  /**
   * Anonymous storefront beacon. No IP or personal data is stored. Events are
   * relayed by the storefront server (one source IP for every visitor, which
   * applies its own per-visitor limit), hence the generous ceiling here.
   */
  @Public()
  @Post('collect')
  @Throttle({ default: { limit: 3000, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async collect(
    @Body() dto: CollectDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-visitor-ip') visitorIp?: string,
  ): Promise<void> {
    // The storefront relay forwards the visitor's IP for geolocation only.
    await this.traffic.collect(dto, userAgent ?? '', visitorIp || req.ip);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('traffic:read')
  sessions(@Query() query: SessionQueryDto) {
    return this.traffic.sessions(query);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('traffic:read')
  stats(@Query() query: TrafficQueryDto) {
    return this.traffic.stats(query);
  }
}
