import {Controller, Post, Body, Get, Param, UseGuards} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiBearerAuth} from '@nestjs/swagger';
import {UsersService} from './users.service';
import {CreateUserDto} from './dto/create-user.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({summary: '회원가입'})
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({summary: '사용자 정보 조회'})
  findOne(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }
}
