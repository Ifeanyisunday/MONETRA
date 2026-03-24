import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Transaction } from "./transaction.entity";

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction) 
    private transactionRepo: Repository<Transaction>) {}

  async history(walletId: string) {
    if (!walletId) {
      throw new BadRequestException("walletId is required");
    }

    const transactions = await this.transactionRepo.find({
       where: { walletId }, order: { createdAt: "DESC" } });

    return transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      date: transaction.createdAt,
  }));
  }
}