import { Controller, Get, Req, Post, Body } from "@nestjs/common";
import { WalletService } from "./wallet.service";


@Controller("wallet")
export class WalletController {

    constructor(private walletService: WalletService) {}

    @Get("balance")
    balance(@Req() req) {

        return this.walletService.getBalance(req.user.id);

    }

    @Post("deposit")
    deposit(@Req() req, @Body() body: { amount: number }) {

        return this.walletService.deposit(req.user.accountNumber, body.amount); 
    }   
}