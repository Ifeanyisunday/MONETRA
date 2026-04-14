import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Wallet } from '../wallets/wallet.entity';

// @Entity()
// export class Transaction {
//   @PrimaryGeneratedColumn('uuid')
//   id!: string;

//   @Column({ unique: true })
//   reference!: string;

//   @ManyToOne(() => Wallet)
//   @JoinColumn({ name: 'senderId' })
//   sender!: Wallet;

//   @Column()
//   senderId!: string;

//   @ManyToOne(() => Wallet)
//   @JoinColumn({ name: 'recipientId' })
//   recipient!: Wallet;

//   @Column()
//   recipientId!: string;

//   @Column('decimal', { precision: 10, scale: 2 })
//   amount!: number;

//   @Column('decimal', { precision: 10, scale: 2 })
//   senderBalanceAfter!: number;

//   @Column('decimal', { precision: 10, scale: 2 })
//   recipientBalanceAfter!: number;

//   @Column({ default: 'transfer' })
//   type!: string;

//   @Column({ default: 'success' })
//   status!: string;

//   @CreateDateColumn()
//   createdAt!: Date;
// }

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: "senderId" })
  sender!: Wallet;

  @Column()
  senderId!: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: "recipientId" })
  recipient!: Wallet;

  @Column()
  recipientId!: string;

  @Column("decimal", { precision: 18, scale: 2 })
  amount!: number;

  // ✅ Default ensures existing rows get a value
  @Column({ length: 3, default: "NGN" })
  currency!: string;

  @Column("decimal", { precision: 18, scale: 2 })
  senderBalanceAfter!: number;

  @Column("decimal", { precision: 18, scale: 2 })
  recipientBalanceAfter!: number;

  @Column()
  type!: string; // deposit, transfer, airtime, bill, etc.

  @Column()
  status!: string; // pending, success, failed, reversed

  @Column({ nullable: true })
  narration?: string;

  @Column({ nullable: true })
  channel?: string; // mobile, USSD, API

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  updatedAt?: Date;

}
