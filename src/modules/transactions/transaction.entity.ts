import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Wallet } from "../wallets/wallet.entity";
@Entity()
export class Transaction {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    walletId: string;

    @ManyToOne(() => Wallet)
    @JoinColumn({ name: "walletId" })
    wallet: Wallet;

    @Column()
    amount: number;

    @Column({
        type: 'enum',
        enum: ['debit', 'credit', 'deposit', 'withdrawal'],
    })
    type: 'debit' | 'credit' | 'deposit' | 'withdrawal';

    @Column({
        type: 'enum',
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    })
    status: 'pending' | 'completed' | 'failed';

    @Column()
    reference: string


    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

}