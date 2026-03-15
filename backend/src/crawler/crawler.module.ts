import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OliveYoungCrawler } from './oliveyoung.crawler';
import { HwahaeCrawler } from './hwahae.crawler';
import { IngredientParserService } from './ingredientParser.service';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { IngredientAlias } from '../ingredients/entities/ingredientAlias.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, IngredientAlias])],
  providers: [OliveYoungCrawler, HwahaeCrawler, IngredientParserService],
  exports: [OliveYoungCrawler, HwahaeCrawler, IngredientParserService],
})
export class CrawlerModule {}
