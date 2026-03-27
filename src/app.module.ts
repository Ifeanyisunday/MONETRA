import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { AppConfigModule } from "./config/config.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./common/authguards/auth.module"
import { WalletModule } from "./modules/wallets/wallet.module";
import { TransactionModule } from "./modules/transactions/transaction.module";
import { TransferModule } from "./modules/transfers/transfer.module";
import { FraudModule } from "./modules/fraud/fraud.module";
import { NotificationModule } from "./modules/notifications/notification.module";
import { LedgerModule } from "./modules/ledger/ledger.module";
import { IdempotencyModule } from "./modules/idempotency/idempotency.module";
import { OutboxModule } from "./modules/outbox/outbox.module";
import { QueueModule } from "./modules/queue/queue.module";
import { BullModule } from "@nestjs/bull";

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    NotificationModule,
    UsersModule,
    AuthModule,
    WalletModule,
    TransactionModule,
    TransferModule,
    FraudModule,
    LedgerModule,
    IdempotencyModule,
    OutboxModule,
    QueueModule,
  ],
})
export class AppModule {}