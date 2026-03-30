import { CreateDateColumn } from "typeorm";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, } from "typeorm";
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
        type: 'text',
    })
    type: 'debit' | 'credit' | 'deposit' | 'withdrawal';

    @Column({
        type: 'text',
        default: 'pending',
    })
    status: 'pending' | 'completed' | 'failed';

    @Column()
    reference: string


    @CreateDateColumn()
    createdAt: Date;

}