import { Injectable } from "@nestjs/common";
import { ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Wallet } from "./wallet.entity"
import { NotificationService } from "../notifications/notification.service";
import { Transaction } from "../transactions/transaction.entity";




@Injectable()
export class WalletService {

   constructor(
      @InjectRepository(Wallet)
      private walletRepo: Repository<Wallet>,

      private notificationService: NotificationService,

      private dataSource: DataSource,
   ) {}



   async deposit(accountNumber: string, amount: number) {
    if (amount <= 0)
        throw new ConflictException("Amount must be greater than zero");

    // Start a database transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 1️⃣ Fetch wallet inside the transaction with a lock
        const wallet = await queryRunner.manager.findOne(Wallet, {
            where: { accountNumber },
            lock: { mode: "pessimistic_write" }, // prevents race conditions
        });
        if (!wallet) throw new ConflictException("Wallet not found");

        // 2️⃣ Add funds
        wallet.balance += amount;
        await queryRunner.manager.save(wallet);

        // 3️⃣ Create transaction log
        const transaction = queryRunner.manager.create(Transaction, {
            walletId: wallet.id,
            amount,
            type: "deposit",
            status: "completed",
        });
        await queryRunner.manager.save(transaction);

        // 4️⃣ Commit transaction
        await queryRunner.commitTransaction();

        // 5️⃣ Send notification (outside transaction to avoid delays)
        this.notificationService.notifyUser(wallet.userId,
             `Your account has been credited with $${amount}. 
             New balance: $${wallet.balance}`);

        return wallet;
    } catch (err) {
        // Rollback if anything fails
        await queryRunner.rollbackTransaction();
        throw new ConflictException(err.message || "Deposit failed");
    } finally {
        await queryRunner.release();
    }
}
   

   async getBalance(userId: string) {

      return this.walletRepo.findOne({
         where: { userId }
      });

   }

}