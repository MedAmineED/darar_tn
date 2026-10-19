import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'سارة' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'بن علي' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ example: 'customer@example.tn' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+216 20 123 456' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
