import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiBearerAuth} from '@nestjs/swagger';
import {RoutinesService} from './routines.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {Routine} from './entities/routine.entity';

@ApiTags('Routines')
@Controller('routines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Get()
  @ApiOperation({summary: '내 루틴 목록 조회'})
  findAll(@Request() req: {user: {id: number}}) {
    return this.routinesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({summary: '루틴 상세 조회'})
  findOne(@Param('id') id: string, @Request() req: {user: {id: number}}) {
    return this.routinesService.findOne(+id, req.user.id);
  }

  @Post()
  @ApiOperation({summary: '루틴 생성'})
  create(@Body() body: Partial<Routine>, @Request() req: {user: {id: number}}) {
    return this.routinesService.create({...body, userId: req.user.id});
  }

  @Patch(':id')
  @ApiOperation({summary: '루틴 수정'})
  update(
    @Param('id') id: string,
    @Body() body: Partial<Routine>,
    @Request() req: {user: {id: number}},
  ) {
    return this.routinesService.update(+id, req.user.id, body);
  }

  @Delete(':id')
  @ApiOperation({summary: '루틴 삭제'})
  remove(@Param('id') id: string, @Request() req: {user: {id: number}}) {
    return this.routinesService.remove(+id, req.user.id);
  }
}
