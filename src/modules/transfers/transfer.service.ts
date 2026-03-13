import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConflictException } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { Wallet } from "../wallets/wallet.entity";
import { CreateTransferDto } from "../dtos/create-transfer.dto";
import { Transaction } from "../transactions/transaction.entity";
import { FraudService } from "../fraud/fraud.service";

@Injectable()
export class TransferService {

    constructor(
        @InjectRepository(Wallet)
        private walletRepo: Repository<Wallet>,

        @InjectRepository(Transaction)
        private transactionRepo: Repository<Transaction>,

        private fraudService: FraudService,

        private dataSource: DataSource,

    ) {}

    async transfer(createTransferDto: CreateTransferDto) {

        const { senderId, recipientAccountNumber, amount} = createTransferDto;

        const isFraud = await this.fraudService.checkTransaction(amount);
        
        if (isFraud) {
            throw new ConflictException("Transaction flagged as fraudulent");
        }

        // Start a database transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Fetch sender & recipient wallets inside the transaction
            const sender = await queryRunner.manager.findOne(Wallet, {
                where: { userId: senderId },
                lock: { mode: "pessimistic_write" } // prevents double spending
            });

            const recipient = await queryRunner.manager.findOne(Wallet, {
                where: { accountNumber: recipientAccountNumber },
                lock: { mode: "pessimistic_write" }
            });

            if (!sender) throw new ConflictException("Sender not found");
            if (!recipient) throw new ConflictException("Recipient not found");
            if (sender.id === recipient.id) throw new ConflictException("Cannot transfer to yourself");
            if (sender.balance < amount) throw new ConflictException("Insufficient funds");

            // Update balances
            sender.balance -= amount;
            recipient.balance += amount;

            await queryRunner.manager.save(sender);
            await queryRunner.manager.save(recipient);

            // Create transaction log for sender (debit)
            await queryRunner.manager.save(
                this.transactionRepo.create({
                    walletId: sender.id,
                    amount,
                    type: "debit",
                    status: "completed",
                })
            );

            // Create transaction log for recipient (credit)
            await queryRunner.manager.save(
                this.transactionRepo.create({
                    walletId: recipient.id,
                    amount,
                    type: "credit",
                    status: "completed",
                })
            );

            // Commit the transaction
            await queryRunner.commitTransaction();

            return { message: "Transfer successful" };

        } catch (err) {
            // Rollback if anything fails
            await queryRunner.rollbackTransaction();
            throw new ConflictException(err.message || "Transfer failed");
        } finally {
            await queryRunner.release();
        }
    }


}
