import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConflictException } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { Wallet } from "../wallets/wallet.entity";
import { Outbox } from "../outbox/outbox.entity";
import { Transaction } from "../transactions/transaction.entity";
import { FraudService } from "../fraud/fraud.service";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationService } from "../notifications/notification.service";
import { v4 as uuidv4 } from "uuid";
import { LedgerEntry } from "../ledger/ledger.entity";



@Injectable()
export class TransferService {

    constructor(
        @InjectRepository(Transaction)
        private transactionRepo: Repository<Transaction>,
        private fraudService: FraudService,
        private dataSource: DataSource,
        private ledgerService: LedgerService,
        private notificationService: NotificationService
    ) {}



async transfer(
  senderId: string,
  recipientAccountNumber: string,
  amount: number
) {
  if (amount <= 0) {
    throw new ConflictException("Amount must be greater than zero");
  }

  return await this.dataSource.transaction(async (manager) => {
    // Lock sender and recipient
    const sender = await manager.findOne(Wallet, {
      where: { userId: senderId },
      lock: { mode: "pessimistic_write" },
    });

    const recipient = await manager.findOne(Wallet, {
      where: { accountNumber: recipientAccountNumber },
      lock: { mode: "pessimistic_write" },
    });

    if (!sender) throw new ConflictException("Sender not found");
    if (!recipient) throw new ConflictException("Recipient not found");
    if (sender.id === recipient.id)
      throw new ConflictException("Cannot transfer to yourself");
    if (sender.balance < amount)
      throw new ConflictException("Insufficient funds");

    const reference = uuidv4();

    // Update balances
    sender.balance -= amount;
    recipient.balance += amount;

    // Ledger entries
    const senderEntry = manager.create(LedgerEntry, {
      walletId: sender.id,
      amount,
      type: "debit",
      reference,
    });

    const receiverEntry = manager.create(LedgerEntry, {
      walletId: recipient.id,
      amount,
      type: "credit",
      reference,
    });

    // Transactions
    const senderTx = manager.create(Transaction, {
      walletId: sender.id,
      amount,
      type: "debit",
      status: "completed",
    });

    const receiverTx = manager.create(Transaction, {
      walletId: recipient.id,
      amount,
      type: "credit",
      status: "completed",
    });

    // Outbox events (JSON payload handled safely)
    const senderEvent = manager.create(Outbox, {
      eventType: "USER_NOTIFICATION",
      payload: {
        userId: sender.userId,
        message: `You sent $${amount} to ${recipient.accountNumber}`,
      },
    });

    const receiverEvent = manager.create(Outbox, {
      eventType: "USER_NOTIFICATION",
      payload: {
        userId: recipient.userId,
        message: `You received $${amount} from ${sender.accountNumber}`,
      },
    });

    // Save everything
    await manager.save([
      sender,
      recipient,
      senderEntry,
      receiverEntry,
      senderTx,
      receiverTx,
      senderEvent,
      receiverEvent,
    ]);

    return {
      message: "Transfer successful",
      sender,
      recipient,
    };
  });
}

}

