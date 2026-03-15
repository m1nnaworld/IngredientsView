import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { Product } from '../product/entities/product.entity';
import { ProductIngredient } from '../product/entities/productIngredient.entity';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { CategoryInteraction } from '../ingredients/entities/categoryInteraction.entity';
import { IngredientInteraction } from '../ingredients/entities/ingredientInteraction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductIngredient,
      Ingredient,
      CategoryInteraction,
      IngredientInteraction,
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
