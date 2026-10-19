import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../audit/audit.service';
import { UpdateDeliverySettingDto } from './dto/update-delivery-setting.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  @Get('delivery')
  @RequirePermissions('setting:read')
  getDelivery() {
    return this.settings.getDelivery();
  }

  @Put('delivery')
  @RequirePermissions('setting:update')
  async updateDelivery(
    @Body() dto: UpdateDeliverySettingDto,
    @CurrentUser('id') actorId: string,
  ) {
    const updated = await this.settings.updateDelivery(dto);
    await this.audit.record({
      userId: actorId,
      action: 'setting.delivery_updated',
      entity: 'Setting',
      entityId: 'delivery',
      metadata: {
        fee: updated.fee,
        freeShippingThreshold: updated.freeShippingThreshold,
      },
    });
    return updated;
  }
}
