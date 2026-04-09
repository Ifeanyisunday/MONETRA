import { Get, Controller, Param, HttpCode } from "@nestjs/common";
import { TransactionService } from "./transaction.service";


@Controller("transactions")
export class TransactionController {
    constructor(private transactionService: TransactionService) {}

    @Get(":walletId/history")
    @HttpCode(200)
    async history(@Param("walletId") walletId: string) {
        console.log('Fetching transaction history for wallet:', walletId);
        return this.transactionService.history(walletId);
    }
}