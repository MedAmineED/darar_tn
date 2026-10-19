import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

/** The role name is immutable once created; only metadata/permissions change. */
export class UpdateRoleDto extends PartialType(
  OmitType(CreateRoleDto, ['name'] as const),
) {}
