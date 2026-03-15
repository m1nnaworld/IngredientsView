import {Controller, Post, Get, Param, Query, Body} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiQuery} from '@nestjs/swagger';
import {IsString} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {IngredientsService} from './ingredients.service';

class AnalyzeIngredientsDto {
  @ApiProperty({example: '물, 글리세린, 나이아신아마이드, 히알루론산'})
  @IsString()
  text: string;
}

@ApiTags('Ingredients')
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post('analyze')
  @ApiOperation({summary: '성분 분석'})
  analyze(@Body() dto: AnalyzeIngredientsDto) {
    return this.ingredientsService.analyzeIngredients(dto.text);
  }

  @Get('search')
  @ApiOperation({summary: '성분 검색'})
  @ApiQuery({name: 'q', description: '검색어'})
  search(@Query('q') query: string) {
    return this.ingredientsService.search(query);
  }

  @Get(':id')
  @ApiOperation({summary: '성분 상세 조회'})
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(+id);
  }
}
