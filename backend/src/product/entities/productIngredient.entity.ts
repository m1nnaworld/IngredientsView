import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';

@Entity('product_ingredients')
@Index(['productId'])
@Index(['ingredientId'])
export class ProductIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column()
  ingredientId: number;

  @Column({ type: 'smallint', default: 0 })
  ingredientOrder: number; // 성분표 순서 (앞일수록 함량 높음)

  @ManyToOne(() => Product, (product) => product.productIngredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Ingredient, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;
}
