import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { LedgerEntry } from "./ledger.entity"

@Injectable()
export class LedgerService {

  constructor(
    @InjectRepository(LedgerEntry)
        private ledgerRepo: Repository<LedgerEntry>
  ) {}

  // Create a ledger entry
  async createEntry(walletId: string, amount: number, type: "debit" | "credit", reference: string) {
    const entry = this.ledgerRepo.create({
      walletId,
      amount,
      type,
    })

    return this.ledgerRepo.save(entry)
  }

  // Calculate current balance
  async getBalance(walletId: string) {
    // const credits = await this.ledgerRepo
    //   .createQueryBuilder("ledger")
    //   .select("SUM(ledger.amount)", "total")
    //   .where("ledger.walletId = :walletId AND ledger.type = :type", { walletId, type: "credit" })
    //   .getRawOne()

    // const debits = await this.ledgerRepo
    //   .createQueryBuilder("ledger")
    //   .select("SUM(ledger.amount)", "total")
    //   .where("ledger.walletId = :walletId AND ledger.type = :type", { walletId, type: "debit" })
    //   .getRawOne()

    // return (parseFloat(credits.total || 0) - parseFloat(debits.total || 0))

    const result = await this.ledgerRepo
      .createQueryBuilder("ledger")
      .select(`
        SUM(
          CASE 
            WHEN ledger.type = 'credit' THEN ledger.amount
            WHEN ledger.type = 'debit' THEN -ledger.amount
            ELSE 0
          END
        )
      `, "balance")
      .where("ledger.walletId = :walletId", { walletId })
      .getRawOne();

    return Number(result.balance) || 0;
  }

  // Get all entries (transaction history)
  async getEntries(walletId: string) {
    return this.ledgerRepo.find({
      where: { walletId },
      order: { createdAt: "DESC" }
    })
  }
}