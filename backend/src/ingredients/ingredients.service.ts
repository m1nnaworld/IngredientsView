import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository, Like} from 'typeorm';
import {Ingredient} from './entities/ingredient.entity';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientsRepository: Repository<Ingredient>,
  ) {}

  async analyzeIngredients(text: string): Promise<{ingredients: Ingredient[]}> {
    const names = text.split(/[,\/\n]/).map(s => s.trim()).filter(Boolean);
    const found: Ingredient[] = [];

    for (const name of names) {
      const ingredient = await this.ingredientsRepository.findOne({
        where: [{name: Like(`%${name}%`)}, {nameKo: Like(`%${name}%`)}],
      });
      if (ingredient) {
        found.push(ingredient);
      }
    }

    return {ingredients: found};
  }

  async findOne(id: number): Promise<Ingredient> {
    const ingredient = await this.ingredientsRepository.findOne({where: {id}});
    if (!ingredient) {
      throw new NotFoundException('성분을 찾을 수 없습니다.');
    }
    return ingredient;
  }

  async search(query: string): Promise<Ingredient[]> {
    return this.ingredientsRepository.find({
      where: [{name: Like(`%${query}%`)}, {nameKo: Like(`%${query}%`)}],
      take: 20,
    });
  }
}
