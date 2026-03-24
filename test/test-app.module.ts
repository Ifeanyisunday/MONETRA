import { Module } from '@nestjs/common';
import { AppConfigModule } from '../src/config/config.module';
import { UsersModule } from '../src/modules/users/users.module';
import { AuthModule } from "../src/common/authguards/auth.module"
import { WalletModule } from '../src/modules/wallets/wallet.module';
import { TransactionModule } from '../src/modules/transactions/transaction.module';
import { TransferModule } from '../src/modules/transfers/transfer.module';
import { TestDatabaseModule } from './db-test/test-db.module';


@Module({
  imports: [
    TestDatabaseModule,
    AppConfigModule,
    UsersModule,
    AuthModule,
    WalletModule,
    TransactionModule,
    TransferModule,
  ],
})
export class TestAppModule {}