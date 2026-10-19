import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({ type: [String], description: 'Role IDs to set on the user' })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roleIds!: string[];
}
