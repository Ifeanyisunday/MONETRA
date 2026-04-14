import { Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,} from '@nestjs/common';
import { Repository, DataSource,} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { Wallet } from '../wallets/wallet.entity';
import { v4 as uuidv4 } from "uuid";


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
    if (!walletId) throw new BadRequestException("walletId is required");

    const wallet = await this.walletRepo.findOne({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException("Wallet not found");

    const transactions = await this.transactionRepo.find({
      where: [{ senderId: walletId }, { recipientId: walletId }],
      order: { createdAt: "DESC" },
    });

    return transactions.map(tx => ({
      id: tx.id,
      reference: tx.reference,
      type: tx.type,
      narration: tx.narration,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      date: tx.createdAt,
      direction: tx.senderId === walletId ? "debit" : "credit",
    }));
  }

  async airtime(userId: string, phoneNumber: string, amount: number) {
    return this.billTransaction(userId, amount, "airtime", `Airtime purchase for ${phoneNumber}`);
  }

  async nepaBill(userId: string, meterNumber: string, amount: number) {
    return this.billTransaction(userId, amount, "nepa-bill", `NEPA bill payment for meter ${meterNumber}`);
  }

  async tvSubscription(userId: string, cardNumber: string, amount: number) {
    return this.billTransaction(userId, amount, "tv-subscription", `TV subscription for card ${cardNumber}`);
  }

  
  private async billTransaction(userId: string, amount: number, type: string, narration: string) {
    if (amount <= 0) throw new ConflictException("Amount must be greater than zero");
    const reference = uuidv4();

    return this.dataSource.transaction(async manager => {
      const wallet = await manager.findOne(Wallet, { where: { userId } });
      if (!wallet) throw new NotFoundException("Wallet not found");
      if (wallet.balance < amount) throw new ConflictException("Insufficient funds");

      wallet.balance = Number(wallet.balance) - amount;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        reference,
        senderId: wallet.id,
        recipientId: wallet.id, // self debit
        amount,
        currency: "NGN",
        senderBalanceAfter: wallet.balance,
        recipientBalanceAfter: wallet.balance,
        type,
        status: "success",
        narration,
        channel: "mobile-app",
      });

      await manager.save(transaction);
      return transaction;
    });
  }
}
