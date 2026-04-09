import { Injectable } from "@nestjs/common";
import { ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Wallet } from "../wallets/wallet.entity";
import { Outbox } from "../outbox/outbox.entity";
import { v4 as uuidv4 } from "uuid";
import { LedgerEntry } from "../ledger/ledger.entity";
import { Transaction } from "../transactions/transaction.entity"
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationService } from "../notifications/notification.service";
import { Logger } from '@nestjs/common';


@Injectable()
export class TransferService {

    private readonly logger = new Logger(TransferService.name)

    constructor(
        private readonly dataSource: DataSource,
        private readonly notificationService: NotificationService,
    ) {}


async transfer(
  senderUserId: string,
  recipientAccountNumber: string,
  amount: number,
  idempotencyKey: string
) {
  if (amount <= 0) throw new ConflictException("Amount must be greater than zero");

  console.log('Service Idempotency Key:', idempotencyKey);

  return this.dataSource.transaction(async (manager) => {
    // --- Check if transaction already exists (idempotency)
    const existingTx = await manager.findOne(Transaction, { where: { reference: idempotencyKey } });
    if (existingTx) {
      // Throws 409 error
      throw new ConflictException({
        message: "Transfer already processed",
        sender: { balance: Number(existingTx.senderBalanceAfter) },
        recipient: { balance: Number(existingTx.recipientBalanceAfter) },
      });
    }

    // --- Fetch wallets with lock
    const sender = await manager.findOne(Wallet, { where: { userId: senderUserId }, lock: { mode: "pessimistic_write" } });
    if (!sender) throw new NotFoundException("Sender wallet not found");

    const recipient = await manager.findOne(Wallet, { where: { accountNumber: recipientAccountNumber }, lock: { mode: "pessimistic_write" } });
    if (!recipient) throw new NotFoundException("Recipient wallet not found");

    const senderBalance = Number(sender.balance);
    const recipientBalance = Number(recipient.balance);

    if (senderBalance < amount) throw new BadRequestException("Insufficient funds");

    // --- Update balances
    sender.balance = senderBalance - amount;
    recipient.balance = recipientBalance + amount;
    await manager.save([sender, recipient]);

    // --- Ledger entries
    const senderLedger = manager.create(LedgerEntry, { walletId: sender.id, amount: -amount, type: "debit", reference: idempotencyKey });
    const recipientLedger = manager.create(LedgerEntry, { walletId: recipient.id, amount, type: "credit", reference: idempotencyKey });

    // --- Transaction record
    const transaction = manager.create(Transaction, {
      reference: idempotencyKey,
      senderId: sender.id,
      recipientId: recipient.id,
      amount,
      senderBalanceAfter: sender.balance,
      recipientBalanceAfter: recipient.balance,
      type: "transfer",
      status: "success",
    });

    // --- Outbox event
    const outboxEvent = manager.create(Outbox, {
      eventType: "USER_NOTIFICATION",
      payload: JSON.stringify({ userId: recipient.userId, message: `You received $${amount} from ${sender.userId}` }),
    });

    await manager.save([senderLedger, recipientLedger, transaction, outboxEvent]);

    // --- Notify users outside transaction
    await this.notificationService.notifyUser(recipient.userId, `You received $${amount} from ${sender.userId}`);
    await this.notificationService.notifyUser(sender.userId, `$${amount} has been sent to ${recipient.userId}`);

    return { message: "Transfer successful", sender: { balance: Number(sender.balance) }, recipient: { balance: Number(recipient.balance) } };
  });
}
  
}
