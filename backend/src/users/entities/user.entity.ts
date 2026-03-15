import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  email: string;

  @Column()
  password: string;

  @Column()
  nickname: string;

  @Column({type: 'varchar', nullable: true})
  skinType: SkinType | null;

  @Column('simple-array', {nullable: true})
  skinConcerns: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
