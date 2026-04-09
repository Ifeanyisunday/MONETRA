// import { CreateDateColumn } from "typeorm";
// import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, } from "typeorm";
// import { Wallet } from "../wallets/wallet.entity";
// import { Index } from "typeorm";


// @Entity()
// export class Transaction {

//     @PrimaryGeneratedColumn('uuid')
//     id!: string;

//     @Column()
//     walletId!: string;

//     @ManyToOne(() => Wallet)
//     @JoinColumn({ name: "walletId" })
//     wallet!: Wallet;

//     @Column()
//     amount!: number;

//     @Column({
//         type: 'text',
//     })
//     type!: 'debit' | 'credit' | 'deposit' | 'withdrawal';

//     @Column({
//         type: 'text',
//         default: 'pending',
//     })
//     status!: 'pending' | 'completed' | 'failed';

//     @Index(["reference", "type"], { unique: true })
//     @Column()
//     reference!: string;


//     @CreateDateColumn()
//     createdAt!: Date;

// }

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Wallet } from '../wallets/wallet.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'senderId' })
  sender!: Wallet;

  @Column()
  senderId!: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'recipientId' })
  recipient!: Wallet;

  @Column()
  recipientId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  senderBalanceAfter!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  recipientBalanceAfter!: number;

  @Column({ default: 'transfer' })
  type!: string;

  @Column({ default: 'success' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
