import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { Wallet } from '../wallets/wallet.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,
    private dataSource: DataSource,
  ) {}
  

  // --- Get transaction history for a wallet
  async history(walletId: string) {
    if (!walletId) throw new BadRequestException('walletId is required');

    const wallet = await this.walletRepo.findOne({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const transactions = await this.transactionRepo.find({
      where: [
        { senderId: walletId },
        { recipientId: walletId },
      ],
      order: { createdAt: 'DESC' },
    });

    return transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      date: tx.createdAt,
    }));
  }
}