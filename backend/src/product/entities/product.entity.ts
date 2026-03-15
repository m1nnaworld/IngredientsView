import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ProductIngredient } from './productIngredient.entity';

@Entity('products')
@Index(['name'])
@Index(['barcode'])
@Index(['oliveyoungId'])
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true, unique: true })
  barcode: string;

  @Column({ nullable: true, unique: true })
  oliveyoungId: string; // goodsNo

  @Column({ nullable: true })
  oliveyoungUrl: string;

  @Column({ nullable: true, unique: true })
  hwahaeId: string;

  @Column({ nullable: true })
  hwahaeUrl: string;

  @Column({ nullable: true, type: 'text' })
  rawIngredientText: string; // 크롤링된 원본 성분 텍스트

  @Column({ default: 'oliveyoung' })
  source: string; // oliveyoung | manual | user

  @OneToMany(() => ProductIngredient, (pi) => pi.product, { cascade: true })
  productIngredients: ProductIngredient[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
