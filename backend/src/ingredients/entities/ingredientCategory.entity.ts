import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity('ingredient_categories')
export class IngredientCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string; // 'retinoid' | 'aha' | 'bha' | 'vitamin_c' | 'niacinamide' | ...

  @Column()
  name: string; // '레티노이드' | 'AHA' | 'BHA' | '비타민C' | ...

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => Ingredient, (ingredient) => ingredient.categories)
  @JoinTable({
    name: 'ingredient_category_map',
    joinColumn: { name: 'categoryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'ingredientId', referencedColumnName: 'id' },
  })
  ingredients: Ingredient[];
}
