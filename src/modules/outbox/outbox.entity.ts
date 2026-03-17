import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity()
export class Outbox {

  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  eventType: string

  @Column("json")
  payload: any

  @Column({ default: false })
  processed: boolean

  @CreateDateColumn()
  createdAt: Date

}