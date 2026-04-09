import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Idempotency {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string; // unique request key

  @Column({ type: 'json', nullable: true })
  response: any;

  @Column({
    type: "enum",
    enum: ["processing", "completed"],
    default: "processing",
  })
  status!: "processing" | "completed";

  @CreateDateColumn()
  createdAt!: Date;

}