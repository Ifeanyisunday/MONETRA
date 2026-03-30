import { Injectable } from "@nestjs/common";
import { ConflictException } from "@nestjs/common";
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


// async transfer(
//   senderId: string,
//   recipientAccountNumber: string,
//   amount: number,
//   idempotencyKey?: string
// ): Promise<{ message: string; sender: Wallet; recipient: Wallet }> {
//   this.logger.log(`Transfer started: ${senderId} → ${recipientAccountNumber}, amount: ${amount}`);

//   if (amount <= 0) {
//     this.logger.warn(`Invalid amount: ${amount}`);
//     throw new ConflictException("Amount must be greater than zero");
//   }

//   try {
//     return await this.dataSource.transaction(async (manager) => {
//       const sender = await manager.findOne(Wallet, {
//         where: { userId: senderId },
//         lock: { mode: "pessimistic_write" },
//       });

//       const recipient = await manager.findOne(Wallet, {
//         where: { accountNumber: recipientAccountNumber },
//         lock: { mode: "pessimistic_write" },
//       });

//       if (!sender) throw new ConflictException("Sender not found");
//       if (!recipient) throw new ConflictException("Recipient not found");
//       if (sender.id === recipient.id) throw new ConflictException("Cannot transfer to yourself");
//       if (sender.balance < amount) throw new ConflictException("Insufficient funds");

//       const reference = idempotencyKey || uuidv4();

//       // Idempotency check
//       const existingDebit = await manager.findOne(LedgerEntry, {
//         where: {
//           walletId: sender.id,
//           reference,
//           type: "debit",
//         },
//       });
      
//       if (existingDebit) {
//         this.logger.log(`Duplicate transfer detected, returning existing wallets`);
//         return { 
//           message: "Transfer already processed", 
//           sender, 
//           recipient 
//         };
//       }

//       // Update balances
//       sender.balance -= amount;
//       recipient.balance += amount;

//       const senderEntry = manager.create(LedgerEntry, {
//         walletId: sender.id,
//         amount,
//         type: "debit",
//         reference,
//       });

//       const receiverEntry = manager.create(LedgerEntry, {
//         walletId: recipient.id,
//         amount,
//         type: "credit",
//         reference,
//       });

//       const senderTx = manager.create(Transaction, {
//         walletId: sender.id,
//         amount,
//         type: "debit",
//         status: "completed",
//         reference,
//       });

//       const receiverTx = manager.create(Transaction, {
//         walletId: recipient.id,
//         amount,
//         type: "credit",
//         status: "completed",
//         reference,
//       });

//       const senderEvent = manager.create(Outbox, {
//         eventType: "USER_NOTIFICATION",
//         payload: JSON.stringify({
//           userId: sender.userId,
//           message: `You sent $${amount} to ${recipient.accountNumber}`,
//         }),
//       });

//       const receiverEvent = manager.create(Outbox, {
//         eventType: "USER_NOTIFICATION",
//         payload: JSON.stringify({
//           userId: recipient.userId,
//           message: `You received $${amount} from ${sender.accountNumber}`,
//         }),
//       });

//       await manager.save([
//         sender,
//         recipient,
//         senderEntry,
//         receiverEntry,
//         senderTx,
//         receiverTx,
//         senderEvent,
//         receiverEvent,
//       ]);

//       // Notifications outside transaction
//       await this.notificationService.notifyUser(
//         sender.userId,
//         `You sent $${amount} to ${recipient.accountNumber}`
//       );
//       await this.notificationService.notifyUser(
//         recipient.userId,
//         `You received $${amount} from ${sender.accountNumber}`
//       );

//       return { message: "Transfer successful", sender, recipient };
//     });
//   } catch (error) {
//     this.logger.error(
//       `Transfer failed: ${senderId} → ${recipientAccountNumber}, amount: ${amount}`,
//       error.stack
//     );
//     throw error;
//   }
// }

// async transfer(
//   senderId: string,
//   recipientAccountNumber: string,
//   amount: number,
//   idempotencyKey?: string
// ): Promise<{ message: string; sender: Wallet; recipient: Wallet }> {

//   this.logger.log(`Transfer started: ${senderId} → ${recipientAccountNumber}, amount: ${amount}`);

//   if (amount <= 0) {
//     this.logger.warn(`Invalid amount: ${amount}`);
//     throw new ConflictException("Amount must be greater than zero");
//   }

//   let result: { message: string; sender: Wallet; recipient: Wallet };

//   try {
//     result = await this.dataSource.transaction(async (manager) => {

//       const sender = await manager.findOne(Wallet, {
//         where: { userId: senderId },
//         lock: { mode: "pessimistic_write" },
//       });

//       const recipient = await manager.findOne(Wallet, {
//         where: { accountNumber: recipientAccountNumber },
//         lock: { mode: "pessimistic_write" },
//       });

//       if (!sender) throw new ConflictException("Sender not found");
//       if (!recipient) throw new ConflictException("Recipient not found");
//       if (sender.id === recipient.id) throw new ConflictException("Cannot transfer to yourself");
//       if (sender.balance < amount) throw new ConflictException("Insufficient funds");

//       const reference = idempotencyKey || uuidv4();

//       // ✅ FIXED idempotency check (only check sender debit)
//       const existingDebit = await manager.findOne(LedgerEntry, {
//         where: {
//           walletId: sender.id,
//           reference,
//           type: "debit",
//         },
//       });

//       if (existingDebit) {
//         this.logger.log(`Duplicate transfer detected, returning existing wallets`);

//         return {
//           message: "Transfer successful",
//           sender,
//           recipient,
//         };
//       }

//       // Update balances
//       sender.balance -= amount;
//       recipient.balance += amount;

//       const senderEntry = manager.create(LedgerEntry, {
//         walletId: sender.id,
//         amount,
//         type: "debit",
//         reference,
//       });

//       const receiverEntry = manager.create(LedgerEntry, {
//         walletId: recipient.id,
//         amount,
//         type: "credit",
//         reference,
//       });

//       const senderTx = manager.create(Transaction, {
//         walletId: sender.id,
//         amount,
//         type: "debit",
//         status: "completed",
//         reference,
//       });

//       const receiverTx = manager.create(Transaction, {
//         walletId: recipient.id,
//         amount,
//         type: "credit",
//         status: "completed",
//         reference,
//       });

//       const senderEvent = manager.create(Outbox, {
//         eventType: "USER_NOTIFICATION",
//         payload: JSON.stringify({
//           userId: sender.userId,
//           message: `You sent $${amount} to ${recipient.accountNumber}`,
//         }),
//       });

//       const receiverEvent = manager.create(Outbox, {
//         eventType: "USER_NOTIFICATION",
//         payload: JSON.stringify({
//           userId: recipient.userId,
//           message: `You received $${amount} from ${sender.accountNumber}`,
//         }),
//       });

//       await manager.save([
//         sender,
//         recipient,
//         senderEntry,
//         receiverEntry,
//         senderTx,
//         receiverTx,
//         senderEvent,
//         receiverEvent,
//       ]);

//       return {
//         message: "Transfer successful",
//         sender,
//         recipient,
//       };
//     });

//     // ✅ AFTER transaction commits (SAFE)
//     await this.notificationService.notifyUser(
//       result.sender.userId,
//       `You sent $${amount} to ${result.recipient.accountNumber}`
//     );

//     await this.notificationService.notifyUser(
//       result.recipient.userId,
//       `You received $${amount} from ${result.sender.accountNumber}`
//     );

//     return result;

//   } catch (error) {
//     this.logger.error(
//       `Transfer failed: ${senderId} → ${recipientAccountNumber}, amount: ${amount}`,
//       error.stack
//     );
//     throw error;
//   }
// }


async transfer(
  senderId: string,
  recipientAccountNumber: string,
  amount: number,
  idempotencyKey?: string
) {
  if (amount <= 0) throw new ConflictException("Amount must be greater than zero");

  let result;
  result = await this.dataSource.transaction(async (manager) => {
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
    if (sender.id === recipient.id) throw new ConflictException("Cannot transfer to yourself");
    if (sender.balance < amount) throw new ConflictException("Insufficient funds");

    const reference = idempotencyKey || uuidv4();

    // Idempotency check
    const existingEntry = await manager.findOne(LedgerEntry, { where: { reference } });
    if (existingEntry) return { message: "Transfer already processed", sender, recipient };

    // Update balances
    sender.balance -= amount;
    recipient.balance += amount;

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
      reference,
    });

    const senderEvent = manager.create(Outbox, {
      eventType: "USER_NOTIFICATION",
      payload: JSON.stringify({
        userId: sender.userId,
        message: `You sent $${amount} to ${recipient.accountNumber}`,
      }),
    });

    const receiverEvent = manager.create(Outbox, {
      eventType: "USER_NOTIFICATION",
      payload: JSON.stringify({
        userId: recipient.userId,
        message: `You received $${amount} from ${sender.accountNumber}`,
      }),
    });

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

    return { message: "Transfer successful", sender, recipient };
  });

  // ✅ Notifications outside transaction
  await this.notificationService.notifyUser(
    result.sender.userId,
    `You sent $${amount} to ${result.recipient.accountNumber}`
  );
  await this.notificationService.notifyUser(
    result.recipient.userId,
    `You received $${amount} from ${result.sender.accountNumber}`
  );

  return result;
}

}

