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



@Injectable()
export class WalletService {

   constructor(
      @InjectRepository(Wallet)
      private walletRepo: Repository<Wallet>,
      private readonly notificationService: NotificationService,
      private readonly dataSource: DataSource,
      private readonly ledgerService: LedgerService,
      private transactionsService: TransactionService
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



async deposit(userId: string, amount: number): Promise<Wallet> {
  if (amount <= 0) {
    throw new ConflictException("Amount must be greater than zero");
  }

  return await this.dataSource.transaction(async (manager) => {
    // Lock wallet for update
    const wallet = await manager.findOne(Wallet, {
      where: { userId },
      lock: { mode: "pessimistic_write" },
    });

    if (!wallet) throw new NotFoundException("Wallet not found");

    const reference = uuidv4();

    // Ledger entry
    const entry = manager.create(LedgerEntry, {
      walletId: wallet.id,
      amount,
      type: "credit",
      reference,
    });

    wallet.balance += amount;

    // Transaction record
    const transaction = manager.create(Transaction, {
      walletId: wallet.id,
      amount,
      type: "credit",
      status: "completed",
    });

    // Outbox event (JSON payload handled via save)
    const outboxEvent = manager.create(Outbox, {
      eventType: "USER_NOTIFICATION",
      payload: {
        userId: wallet.userId,
        message: `Your account has been credited with $${amount}. New balance: $${wallet.balance}`,
      },
    });

    // Save all in one go
    await manager.save([entry, wallet, transaction, outboxEvent]);

    return wallet;
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