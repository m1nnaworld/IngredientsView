import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity('ingredient_aliases')
@Index(['ingredientId'])
export class IngredientAlias {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  ingredientId: number;

  @Column({ nullable: false })
  alias: string;

  @Column({ nullable: false })
  language: string; // 'ko' | 'en'

  @Column({ nullable: true })
  source: string;

  @ManyToOne(() => Ingredient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;
}
