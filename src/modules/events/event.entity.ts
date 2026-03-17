import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Event {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  type: string;

  @Column("json")
  payload: any;

  @CreateDateColumn()
  createdAt: Date;

}