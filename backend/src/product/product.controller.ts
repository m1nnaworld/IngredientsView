import { Controller, Get, Param, Post, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('search')
  @ApiOperation({ summary: '제품 검색 (DB → 올리브영 크롤링 fallback)' })
  @ApiQuery({ name: 'q', description: '제품명 또는 브랜드명' })
  async search(@Query('q') keyword: string) {
    if (!keyword?.trim()) {
      throw new BadRequestException('검색어를 입력해주세요.');
    }
    return this.productService.search(keyword.trim());
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: '바코드로 제품 조회 (DB → 올리브영 크롤링 fallback)' })
  async findByBarcode(@Param('barcode') barcode: string) {
    const product = await this.productService.findByBarcode(barcode);
    if (!product) {
      return { message: '제품을 찾을 수 없습니다.', barcode };
    }
    return product;
  }

  @Post('sync-ingredients')
  @ApiOperation({ summary: 'rawIngredientText 기반으로 product_ingredients 일괄 생성' })
  async syncIngredients() {
    return this.productService.syncProductIngredients();
  }
}
