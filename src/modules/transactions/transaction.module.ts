import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "./transaction.entity";
import { TransactionService } from "./transaction.service";
import { Wallet } from "../wallets/wallet.entity";
import { LedgerService } from "../ledger/ledger.service";

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Wallet])],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}