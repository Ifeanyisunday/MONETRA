import { Injectable, ConflictException, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, QueryRunner } from "typeorm";
import { Wallet } from "./wallet.entity";
import { NotificationService } from "../notifications/notification.service";
import { LedgerService } from "../ledger/ledger.service";
import { TransactionService } from "../transactions/transaction.service";
import { LedgerEntry } from "../ledger/ledger.entity";
import { Transaction } from "../transactions/transaction.entity";
import { Outbox } from "../outbox/outbox.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
    private readonly ledgerService: LedgerService,
    private transactionsService: TransactionService
  ) {}

  // -------------------- CREATE WALLET --------------------
  async createWallet(userId: string, queryRunner?: QueryRunner) {
    const runner = queryRunner || this.dataSource.createQueryRunner();

    if (!queryRunner) {
      await runner.connect();
      await runner.startTransaction();
    }

    try {
      const existingWallet = await runner.manager.findOne(Wallet, { where: { userId } });
      if (existingWallet) throw new ConflictException("Wallet already exists");

      const accountNumber = "10" + Math.floor(100000000 + Math.random() * 900000000);

      const wallet = runner.manager.create(Wallet, { userId, accountNumber, balance: 0 });
      const savedWallet = await runner.manager.save(wallet);

      await runner.commitTransaction();
      return savedWallet;
    } catch (err) {
      if (err instanceof Error) {
        await runner.rollbackTransaction();
        throw new ConflictException(err.message || "Wallet creation failed");
      }
    } finally {
      await runner.release();
    }
  }

  // -------------------- DEPOSIT --------------------
  async deposit(userId: string, amount: number, idempotencyKey?: string) {
    if (amount <= 0) throw new ConflictException("Amount must be greater than zero");

    const reference = idempotencyKey || uuidv4();

    return this.dataSource.transaction(async (manager) => {
      // --- Idempotency check
      const existingTx = await manager.findOne(Transaction, { where: { reference } });
      if (existingTx) {
        return {
          status: 409,
          message: "Deposit already processed",
          wallet: { balance: existingTx.recipientBalanceAfter },
        };
      }

      // --- Fetch wallet with lock
      const wallet = await manager.findOne(Wallet, { 
        where: { userId },
        lock: { mode: "pessimistic_write" },
      });
      if (!wallet) throw new NotFoundException("Wallet not found");

      if (amount < 100) throw new ConflictException("Minimum deposit is ₦100");

      // --- Update balance
      wallet.balance = Number(wallet.balance) + amount;
      await manager.save(wallet);

      // --- Ledger entry
      const ledgerEntry = manager.create(LedgerEntry, {
        walletId: wallet.id,
        amount,
        type: "credit",
        reference,
      });

      // --- Transaction record (self-deposit)
      const transaction = manager.create(Transaction, {
        reference,
        senderId: wallet.id,
        recipientId: wallet.id,
        amount,
        currency: "NGN", // ✅ new field
        senderBalanceAfter: wallet.balance,
        recipientBalanceAfter: wallet.balance,
        type: "deposit",
        status: "success",
        narration: `Deposit of ₦${amount}`, // ✅ new field
        channel: "mobile-app",             // ✅ new field
      });

      // --- Outbox event for notification
      const outboxEvent = manager.create(Outbox, {
        eventType: "USER_NOTIFICATION",
        payload: JSON.stringify({
          userId: wallet.userId,
          message: `Your account has been credited with ₦${amount}. New balance: ₦${wallet.balance}`,
        }),
      });

      // --- Save all records
      await manager.save([ledgerEntry, transaction, outboxEvent]);

      // --- Send notifications (outside DB transaction)
      await this.notificationService.notifyUser(
        wallet.userId,
        `Your account has been credited with ₦${amount}. New balance: ₦${Number(wallet.balance)}`
      );

      return {
        message: "Deposit successful",
        wallet: {
          accountNumber: wallet.accountNumber,
          balance: Number(wallet.balance),
        },
      };
    });
  }


  // -------------------- FIND WALLET BY USER --------------------
  async findByUserId(userId: string) {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new ConflictException("Wallet not found");
    return wallet;
  }
}