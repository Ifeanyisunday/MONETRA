import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";


@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ unique: true })
  accountNumber!: string;

  @Column({ type: "int", default: 0 })
  balance!: number
}