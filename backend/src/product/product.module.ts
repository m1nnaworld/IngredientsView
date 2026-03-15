import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { ProductIngredient } from './entities/productIngredient.entity';
import { CrawlerModule } from '../crawler/crawler.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductIngredient]),
    CrawlerModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
