import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Check,
  Unique,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { InteractionType } from './categoryInteraction.entity';

@Entity('ingredient_interactions')
@Check('"ingredientAId" <> "ingredientBId"')
@Unique(['ingredientAId', 'ingredientBId'])
export class IngredientInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ingredientAId: number;

  @Column()
  ingredientBId: number;

  @Column()
  type: InteractionType; // 'conflict' | 'synergy' | 'caution'

  @Column({ type: 'smallint' })
  severity: number; // 1~5

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ default: 'expert' })
  source: string; // 'expert' | 'research'

  @ManyToOne(() => Ingredient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredientAId' })
  ingredientA: Ingredient;

  @ManyToOne(() => Ingredient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredientBId' })
  ingredientB: Ingredient;
}
