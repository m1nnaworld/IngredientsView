import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { IngredientCategory } from './ingredientCategory.entity';

export type InteractionType = 'conflict' | 'synergy' | 'caution';

@Entity('category_interactions')
@Check('"categoryAId" <> "categoryBId"')
export class CategoryInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoryAId: number;

  @Column()
  categoryBId: number;

  @Column()
  type: InteractionType; // 'conflict' | 'synergy' | 'caution'

  @Column({ type: 'smallint' })
  severity: number; // 1~5 (5가 가장 강한 영향)

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ nullable: true })
  timeOfDay: string | null; // 'morning' | 'evening' | 'both' | null

  @Column({ default: 'expert' })
  source: string; // 'expert' | 'research'

  @ManyToOne(() => IngredientCategory, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryAId' })
  categoryA: IngredientCategory;

  @ManyToOne(() => IngredientCategory, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryBId' })
  categoryB: IngredientCategory;
}
