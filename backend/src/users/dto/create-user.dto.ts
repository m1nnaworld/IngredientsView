import {IsEmail, IsString, MinLength, IsOptional, IsIn, IsArray} from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({example: 'user@example.com'})
  @IsEmail()
  email: string;

  @ApiProperty({minLength: 8})
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({example: '성분러버'})
  @IsString()
  nickname: string;

  @ApiPropertyOptional({enum: ['dry', 'oily', 'combination', 'sensitive', 'normal']})
  @IsOptional()
  @IsIn(['dry', 'oily', 'combination', 'sensitive', 'normal'])
  skinType?: string;

  @ApiPropertyOptional({type: [String], example: ['acne', 'dryness']})
  @IsOptional()
  @IsArray()
  skinConcerns?: string[];
}
