import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "../transactions/transaction.entity";
import { TransferService } from "./transfer.service";
import { TransferController } from "./transfer.controller";
import { LedgerModule } from "../ledger/ledger.module";
import { NotificationModule } from "../notifications/notification.module";
import { FraudModule } from "../fraud/fraud.module";


@Module({
  imports: [TypeOrmModule.forFeature([Transaction]),
  forwardRef(() => LedgerModule),
  forwardRef(() => NotificationModule),
  forwardRef(() => FraudModule)
],
  providers: [TransferService],
  controllers: [TransferController],
  exports: [TransferService],
})
export class TransferModule {}