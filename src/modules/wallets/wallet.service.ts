import { Injectable } from "@nestjs/common";
import { ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Wallet } from "./wallet.entity"
import { NotificationService } from "../notifications/notification.service";
import { Transaction } from "../transactions/transaction.entity";
import { LedgerService } from "../ledger/ledger.service";
import { TransactionService } from "../transactions/transaction.service";




@Injectable()
export class WalletService {

   constructor(
      @InjectRepository(Wallet)
      private walletRepo: Repository<Wallet>,
      private notificationService: NotificationService,
      private dataSource: DataSource,
      private ledgerService: LedgerService,
      private transactionsService: TransactionService
   ) {}



    async createWallet(userId: string) {

        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            // 1️⃣ Check if user already has a wallet
            const existingWallet = await queryRunner.manager.findOne(Wallet, {
            where: { userId }
            });

            if (existingWallet) {
            throw new ConflictException("Wallet already exists for this user");
            }

            // 2️⃣ Generate unique account number
            const accountNumber =
            "10" + Math.floor(100000000 + Math.random() * 900000000);

            // 3️⃣ Create wallet
            const wallet = queryRunner.manager.create(Wallet, {
            userId,
            accountNumber,
            balance: 0
            });

            const savedWallet = await queryRunner.manager.save(wallet);

            await queryRunner.commitTransaction();

            return savedWallet;

        } catch (err) {

            await queryRunner.rollbackTransaction();
            throw new ConflictException(err.message || "Wallet creation failed");

        } finally {

            await queryRunner.release();

        }

    }



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
            await queryRunner.manager.save(
                this.ledgerService.createEntry(
                    wallet.id,
                    amount,
                    "credit",
                    "Deposit"
                )
            );

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

            const balanceFromLedger = await this.ledgerService.getBalance(wallet.id);

            if (balanceFromLedger !== wallet.balance) {
            throw new Error("Ledger mismatch detected 🚨");
            }


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
         where: { userId },
         select: ["id", "accountNumber", "balance"]
      });
   }


   async transactions(walletId: string) {

     return this.transactionsService.history(walletId);
   }

   
   async findByUserId(userId: string) {

      const wallet = await this.walletRepo.findOne({ where: { userId } });

      if (!wallet) throw new ConflictException("Wallet not found");

      return wallet;
   }

}