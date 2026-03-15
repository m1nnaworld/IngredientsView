import {Controller, Post, Body} from '@nestjs/common';
import {ApiTags, ApiOperation} from '@nestjs/swagger';
import {IsEmail, IsString} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {AuthService} from './auth.service';

class LoginDto {
  @ApiProperty({example: 'user@example.com'})
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({summary: '로그인'})
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
