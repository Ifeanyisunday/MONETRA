import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Transaction } from "./transaction.entity";

@Injectable()
export class TransactionService {
  constructor(@InjectRepository(Transaction) private transactionRepo: Repository<Transaction>) {}

  async history(walletId: string) {
    const transactions = await this.transactionRepo.find({
       where: { walletId }, order: { createdAt: "DESC" } });

    return transactions.map(transaction => ({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    status: transaction.status,
    date: transaction.createdAt,

    // // optional UX improvements
    // description:
    //   tx.type === "debit"
    //     ? `You sent ₦${tx.amount}`
    //     : tx.type === "credit"
    //     ? `You received ₦${tx.amount}`
    //     : `Transaction of ₦${tx.amount}`
  }));
  }
}