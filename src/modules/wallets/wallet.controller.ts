import { Controller, Get, Req, Post, Body, UseGuards, HttpCode } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../../common/authguards/jwt-auth-guard"


@Controller("wallet")
export class WalletController {

    constructor(private walletService: WalletService) {}

    @UseGuards(JwtAuthGuard)
    @Post("deposit")
    @HttpCode(201)
    async deposit(@Req() req, @Body() body) {

        return this.walletService.deposit(req.user.id, body.amount); 
    }   

}