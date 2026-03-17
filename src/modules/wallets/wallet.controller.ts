import { Controller, Get, Req, Post, Body } from "@nestjs/common";
import { WalletService } from "./wallet.service";


@Controller("wallet")
export class WalletController {

    constructor(private walletService: WalletService) {}

    @Get("balance")
    async balance(@Req() req) {
        return this.walletService.getBalance(req.user.id);
    }

    @Post("deposit")
    async deposit(@Req() req, @Body() body: { amount: number }) {

        return this.walletService.deposit(req.user.accountNumber, body.amount); 
    }   

    @Get("transactions")
    async getTransactions(@Req() req) {
        const wallet = await this.walletService.findByUserId(req.user.id);
        return this.walletService.transactions(wallet.id);
    }
}