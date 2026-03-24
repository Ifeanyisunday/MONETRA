import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { Wallet } from "./wallet.entity";
import { NotificationModule } from "../notifications/notification.module";
import { LedgerModule } from "../ledger/ledger.module";
import { TransactionModule } from "../transactions/transaction.module";

@Module({
  imports: [TypeOrmModule.forFeature([Wallet]),
    NotificationModule,
    LedgerModule,
    TransactionModule
],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}