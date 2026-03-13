import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Transaction } from "./transaction.entity";

@Injectable()
export class TransactionService {
  constructor(@InjectRepository(Transaction) private transactionRepo: Repository<Transaction>) {}

  async history(walletId: string) {
    return this.transactionRepo.find({ where: { walletId }, order: { createdAt: "DESC" } });
  }
}