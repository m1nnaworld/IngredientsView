import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import {User} from '../../users/entities/user.entity';

@Entity('routines')
export class Routine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({type: 'jsonb', default: []})
  steps: RoutineStep[];

  @ManyToOne(() => User, {onDelete: 'CASCADE'})
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface RoutineStep {
  order: number;
  productId: number;
  productName: string;
  timeOfDay: 'morning' | 'evening' | 'both';
}
