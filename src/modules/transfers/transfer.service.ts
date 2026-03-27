import { Injectable } from "@nestjs/common";
import { ConflictException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Wallet } from "../wallets/wallet.entity";
import { Outbox } from "../outbox/outbox.entity";
import { v4 as uuidv4 } from "uuid";
import { LedgerEntry } from "../ledger/ledger.entity";
import { Repository } from "typeorm";
import { Transaction } from "../transactions/transaction.entity"
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationService } from "../notifications/notification.service";
import { Logger } from '@nestjs/common';


@Injectable()
export class TransferService {

    constructor(
        @InjectRepository(Transaction)
        private dataSource: DataSource,
        private notificationService: NotificationService,
        private readonly logger = new Logger(TransferService.name)
    ) {}




// async transfer(
//   senderId: string,
//   recipientAccountNumber: string,
//   amount: number,
//   idempotencyKey?: string
// ) {
//   if (amount <= 0) {
//     throw new ConflictException("Amount must be greater than zero");
//   }

//   return await this.dataSource.transaction(async (manager) => {
//     // Lock sender and recipient
//     const sender = await manager.findOne(Wallet, {
//       where: { userId: senderId },
//       lock: { mode: "pessimistic_write" },
//     });

//     const recipient = await manager.findOne(Wallet, {
//       where: { accountNumber: recipientAccountNumber },
//       lock: { mode: "pessimistic_write" },
//     });

//     if (!sender) throw new ConflictException("Sender not found");
//     if (!recipient) throw new ConflictException("Recipient not found");
//     if (sender.id === recipient.id)
//       throw new ConflictException("Cannot transfer to yourself");
//     if (sender.balance < amount)
//       throw new ConflictException("Insufficient funds");

//     const reference = idempotencyKey || uuidv4();

//     // Update balances
//     sender.balance -= amount;
//     recipient.balance += amount;

//     // Ledger entries
//     const senderEntry = manager.create(LedgerEntry, {
//       walletId: sender.id,
//       amount,
//       type: "debit",
//       reference,
//     });

//     const receiverEntry = manager.create(LedgerEntry, {
//       walletId: recipient.id,
//       amount,
//       type: "credit",
//       reference,
//     });

//     // Transactions
//     const senderTx = manager.create(Transaction, {
//       walletId: sender.id,
//       amount,
//       type: "debit",
//       status: "completed",
//       reference,
//     });

//     const receiverTx = manager.create(Transaction, {
//       walletId: recipient.id,
//       amount,
//       type: "credit",
//       status: "completed",
//     });

//     // Outbox events (JSON payload handled safely)
//     const senderEvent = manager.create(Outbox, {
//       eventType: "USER_NOTIFICATION",
//       payload: {
//         userId: sender.userId,
//         message: `You sent $${amount} to ${recipient.accountNumber}`,
//       },
//     });

//     const receiverEvent = manager.create(Outbox, {
//       eventType: "USER_NOTIFICATION",
//       payload: {
//         userId: recipient.userId,
//         message: `You received $${amount} from ${sender.accountNumber}`,
//       },
//     });


//     // Save everything
//     await manager.save([
//       sender,
//       recipient,
//       senderEntry,
//       receiverEntry,
//       senderTx,
//       receiverTx,
//       senderEvent,
//       receiverEvent,
//     ]);

//     // 🔥 Push async notifications via queue
//     await this.notificationService.notifyUser(sender.userId, `You sent $${amount} to ${recipient.accountNumber}`);
//     await this.notificationService.notifyUser(recipient.userId, `You received $${amount} from ${sender.accountNumber}`);


//     return {
//       message: "Transfer successful",
//       sender,
//       recipient,
//     };
//   });
// }

async transfer(
  senderId: string,
  recipientAccountNumber: string,
  amount: number,
  idempotencyKey?: string
) {
  this.logger.log(`Transfer started: ${senderId} → ${recipientAccountNumber}, amount: ${amount}`);

  if (amount <= 0) {
    this.logger.warn(`Invalid amount: ${amount}`);
    throw new ConflictException("Amount must be greater than zero");
  }

  try {
    return await this.dataSource.transaction(async (manager) => {
      this.logger.log('Fetching wallets with pessimistic lock');

      const sender = await manager.findOne(Wallet, {
        where: { userId: senderId },
        lock: { mode: "pessimistic_write" },
      });

      const recipient = await manager.findOne(Wallet, {
        where: { accountNumber: recipientAccountNumber },
        lock: { mode: "pessimistic_write" },
      });

      if (!sender) {
        this.logger.warn(`Sender not found: ${senderId}`);
        throw new ConflictException("Sender not found");
      }

      if (!recipient) {
        this.logger.warn(`Recipient not found: ${recipientAccountNumber}`);
        throw new ConflictException("Recipient not found");
      }

      if (sender.id === recipient.id) {
        this.logger.warn(`Self-transfer attempt: ${senderId}`);
        throw new ConflictException("Cannot transfer to yourself");
      }

      if (sender.balance < amount) {
        this.logger.warn(`Insufficient funds: ${senderId}, balance: ${sender.balance}`);
        throw new ConflictException("Insufficient funds");
      }

      const reference = idempotencyKey || uuidv4();
      this.logger.log(`Transaction reference: ${reference}`);

      // Update balances
      sender.balance -= amount;
      recipient.balance += amount;

      this.logger.log(`Balances updated: sender=${sender.balance}, recipient=${recipient.balance}`);

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
        reference,
      });

      const receiverTx = manager.create(Transaction, {
        walletId: recipient.id,
        amount,
        type: "credit",
        status: "completed",
      });

      // Outbox events
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

      this.logger.log('Saving transaction data to database');

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

      this.logger.log('Database transaction committed successfully');

      // Queue notifications
      await this.notificationService.notifyUser(
        sender.userId,
        `You sent $${amount} to ${recipient.accountNumber}`
      );

      await this.notificationService.notifyUser(
        recipient.userId,
        `You received $${amount} from ${sender.accountNumber}`
      );

      this.logger.log('Notifications queued successfully');

      return {
        message: "Transfer successful",
        sender,
        recipient,
      };
    });
  } catch (error) {
    this.logger.error(
      `Transfer failed: ${senderId} → ${recipientAccountNumber}, amount: ${amount}`,
      error.stack
    );
    throw error;
  }
}

}

