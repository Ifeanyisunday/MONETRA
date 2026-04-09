import { Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  Unique } from "typeorm"


@Unique(["walletId", "reference", "type"])
@Entity()
export class LedgerEntry {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  walletId!: string

  @Column()
  type!: "debit" | "credit"

  @Column({ type: "decimal", precision: 18, scale: 2 })
  amount!: number

  @CreateDateColumn()
  createdAt!: Date

  @Column()
  reference!: string

}