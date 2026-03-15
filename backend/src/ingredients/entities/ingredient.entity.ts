import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToMany} from 'typeorm';
import {IngredientCategory} from './ingredientCategory.entity';

@Entity('ingredients')
@Index(['name'])
@Index(['nameKo'])
@Index(['ewgScoreMin'])
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  name: string; // INCI명 (영문)

  @Column({nullable: true})
  nameKo: string; // 한글명

  @Column({type: 'smallint', nullable: true})
  ewgScoreMin: number | null;

  @Column({type: 'smallint', nullable: true})
  ewgScoreMax: number | null;

  @Column('simple-array', {nullable: true})
  functions: string[];

  @Column({type: 'text', nullable: true})
  description: string;

  @Column('simple-array', {nullable: true})
  concerns: string[];

  @Column({default: 'mfds'})
  source: string; // ewg+mfds / mfds / user

  @Column({default: false})
  isVerified: boolean;

  @ManyToMany(() => IngredientCategory, (category) => category.ingredients)
  categories: IngredientCategory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
