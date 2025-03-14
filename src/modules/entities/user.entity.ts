import { IsOptional } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  username: string;

  @Column({ type: 'boolean', nullable: true })
  @IsOptional()
  confirmationCode?: boolean;

  @Column({ type: 'varchar', nullable: true })
  sub: string; // Este é o campo que armazenará o valor do 'sub' do JWT

  @Column({ type: 'boolean' })
  isAdmin: boolean;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  name?: string;

  @Column()
  password: string;
}
