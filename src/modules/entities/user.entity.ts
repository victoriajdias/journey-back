import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid') // Define um ID como UUID automaticamente gerado
  id: string; // O tipo deve ser `string` e não `String` (boas práticas em TypeScript)

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false }) // Se isAdmin for boolean, defina um valor padrão
  isAdmin: boolean;
}
