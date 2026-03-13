import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Transaction {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    walletId: string;

    @Column()
    amount: number;

    @Column()
    type: 'debit' | 'credit' | 'deposit' | 'withdrawal';

    @Column()
    status: 'pending' | 'completed' | 'failed';

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

}