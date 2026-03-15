import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { AnalysisService } from './analysis.service';

class AnalyzeRoutineDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  productIds: number[];
}

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('routine')
  @ApiOperation({ summary: '루틴 성분 분석 (점수 + 충돌/시너지)' })
  async analyzeRoutine(@Body() dto: AnalyzeRoutineDto) {
    if (!dto.productIds?.length) {
      throw new BadRequestException('productIds가 필요합니다.');
    }
    return this.analysisService.analyzeRoutine(dto.productIds);
  }

  @Post('combinations')
  @ApiOperation({ summary: '성분 조합 궁합 분석 (ingredient_interactions 기반)' })
  async analyzeCombinations(@Body() dto: AnalyzeRoutineDto) {
    if (!dto.productIds?.length) {
      throw new BadRequestException('productIds가 필요합니다.');
    }
    return this.analysisService.analyzeIngredientCombinations(dto.productIds);
  }
}
