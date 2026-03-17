import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Wallet {

 @PrimaryGeneratedColumn("uuid")
 id: string;

 @Column()
 userId: string;

 @Column()
 accountNumber: string;

 @Column({ default: 0 })
 balance: number;
 
}