import { Get, Controller, Param } from "@nestjs/common";
import { TransactionService } from "./transaction.service";


@Controller("transactions")
export class TransactionController {
    constructor(private transactionService: TransactionService) {}

    @Get(":walletId/history")
    async history(@Param("walletId") walletId: string) {
        return this.transactionService.history(walletId);
    }
}