import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Idempotency {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  key: string; // unique request key

  @Column()
  response: string; // stored response

  @CreateDateColumn()
  createdAt: Date;

}