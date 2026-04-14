import { Controller, 
    Get, 
    Req, 
    Post, 
    Body, UseGuards,
    HttpCode, UseInterceptors, 
    Headers, NotFoundException } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../../common/authguards/jwt-auth-guard"
import { IdempotencyInterceptor } from "../idempotency/idempotency.interceptor";
import { TransactionService } from "../transactions/transaction.service";


@Controller("wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {

    constructor(private walletService: WalletService,
        private transactionService: TransactionService
    ) {}


    @UseInterceptors(IdempotencyInterceptor)
    @Post("deposit")
    @HttpCode(201)
    async deposit(@Req() req, @Body() body: { amount: number }) {
    return this.walletService.deposit(
        req.user.userId, // comes from JWT payload
        body.amount,
        req.idempotencyKey, // ✅ provided by the interceptor
    );
    }
 

    
    @Get('me')
    async getMyWallet(@Req() req) {
        const userId = req.user.userId; // comes from JWT payload
        return this.walletService.findByUserId(userId);
    }

    
    @Post("airtime")
    async buyAirtime(
        @Req() req,
        @Body() body: { phoneNumber: string; amount: number }
    ) {
        const userId = req.user.userId;
        return this.transactionService.airtime(userId, body.phoneNumber, body.amount);
    }


    
    @Post("nepabill")
    async payNepaBill(
        @Req() req,
        @Body() body: { meterNumber: string; amount: number }
    ) {
        const userId = req.user.userId;
        return this.transactionService.nepaBill(userId, body.meterNumber, body.amount);
    }


    @Post("tvsubscription")
    async payTvSubscription(
        @Req() req,
        @Body() body: { cardNumber: string; amount: number }
    ) {
        const userId = req.user.userId;
        return this.transactionService.tvSubscription(userId, body.cardNumber, body.amount);
    }

    
    @Get("transactions")
    @HttpCode(200)
    async getUserTransactions(@Req() req) {
        const userId = req.user.userId;
        const wallet = await this.walletService.findByUserId(userId);
        if (!wallet) throw new NotFoundException("Wallet not found");
        return this.transactionService.history(wallet.id);
    }
}
