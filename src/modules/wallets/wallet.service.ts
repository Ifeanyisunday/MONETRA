import { Injectable } from "@nestjs/common";
import { ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Wallet } from "./wallet.entity"
import { NotificationService } from "../notifications/notification.service";
import { Transaction } from "../transactions/transaction.entity";
import { LedgerService } from "../ledger/ledger.service";
import { TransactionService } from "../transactions/transaction.service";
import { QueryRunner } from "typeorm/browser";
import { v4 as uuidv4 } from "uuid";
import { LedgerEntry } from "../ledger/ledger.entity";
import { Outbox } from "../outbox/outbox.entity";
import { Logger } from "@nestjs/common";



@Injectable()
export class WalletService {

   constructor(
      @InjectRepository(Wallet)
      private walletRepo: Repository<Wallet>,
      private readonly notificationService: NotificationService,
      private readonly dataSource: DataSource,
      private readonly ledgerService: LedgerService,
      private transactionsService: TransactionService,
      private readonly logger = new Logger(WalletService.name)
   ) {}



  async createWallet(userId: string, queryRunner?: QueryRunner) {

        const runner = queryRunner || this.dataSource.createQueryRunner();

        if (!queryRunner) {
            await runner.connect();
            await runner.startTransaction();
        }

        try {

            // 1️⃣ Check if user already has a wallet
            const existingWallet = await runner.manager.findOne(Wallet, {
            where: { userId }
            });

            if (existingWallet) {
            throw new ConflictException("Wallet already exists for this user");
            }

            // 2️⃣ Generate unique account number
            const accountNumber =
            "10" + Math.floor(100000000 + Math.random() * 900000000);

            // 3️⃣ Create wallet
            const wallet = runner.manager.create(Wallet, {
            userId,
            accountNumber,
            balance: 0
            });

            const savedWallet = await runner.manager.save(wallet);

            await runner.commitTransaction();

            return savedWallet;

        } catch (err) {

            await runner.rollbackTransaction();
            throw new ConflictException(err.message || "Wallet creation failed");

        } finally {

            await runner.release();

        }

    }



// async deposit(userId: string, amount: number): Promise<Wallet> {
//   if (amount <= 0) {
//     throw new ConflictException("Amount must be greater than zero");
//   }

//   return await this.dataSource.transaction(async (manager) => {
//     // Lock wallet for update
//     const wallet = await manager.findOne(Wallet, {
//       where: { userId },
//       lock: { mode: "pessimistic_write" },
//     });

//     if (!wallet) throw new NotFoundException("Wallet not found");

//     const reference = uuidv4();

//     // Ledger entry
//     const entry = manager.create(LedgerEntry, {
//       walletId: wallet.id,
//       amount,
//       type: "credit",
//       reference,
//     });

//     wallet.balance += amount;

//     // Transaction record
//     const transaction = manager.create(Transaction, {
//       walletId: wallet.id,
//       amount,
//       type: "credit",
//       status: "completed",
//     });

//     // Outbox event (JSON payload handled via save)
//     const outboxEvent = manager.create(Outbox, {
//       eventType: "USER_NOTIFICATION",
//       payload: {
//         userId: wallet.userId,
//         message: `Your account has been credited with $${amount}. New balance: $${wallet.balance}`,
//       },
//     });

//     // Save all in one go
//     await manager.save([entry, wallet, transaction, outboxEvent]);

//     await this.notificationService.notifyUser(wallet.userId, `Your account has been credited with $${amount}. New balance: $${wallet.balance}`);

//     return wallet;
//   });
// }

async deposit(userId: string, amount: number): Promise<Wallet> {
  this.logger.log(`Deposit started: user=${userId}, amount=${amount}`);

  if (amount <= 0) {
    this.logger.warn(`Invalid deposit amount: ${amount}`);
    throw new ConflictException("Amount must be greater than zero");
  }

  try {
    return await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: "pessimistic_write" },
      });

      if (!wallet) {
        this.logger.warn(`Wallet not found for user: ${userId}`);
        throw new NotFoundException("Wallet not found");
      }

      const reference = uuidv4();

      wallet.balance += amount;

      this.logger.log(`New balance: ${wallet.balance}`);

      const entry = manager.create(LedgerEntry, {
        walletId: wallet.id,
        amount,
        type: "credit",
        reference,
      });

      const transaction = manager.create(Transaction, {
        walletId: wallet.id,
        amount,
        type: "credit",
        status: "completed",
      });

      const outboxEvent = manager.create(Outbox, {
        eventType: "USER_NOTIFICATION",
        payload: {
          userId: wallet.userId,
          message: `Your account has been credited with $${amount}. New balance: $${wallet.balance}`,
        },
      });

      await manager.save([entry, wallet, transaction, outboxEvent]);

      this.logger.log('Deposit saved successfully');

      await this.notificationService.notifyUser(
        wallet.userId,
        `Your account has been credited with $${amount}. New balance: $${wallet.balance}`
      );

      this.logger.log('Deposit notification queued');

      return wallet;
    });
  } catch (error) {
    this.logger.error(`Deposit failed for user: ${userId}`, error.stack);
    throw error;
  }
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