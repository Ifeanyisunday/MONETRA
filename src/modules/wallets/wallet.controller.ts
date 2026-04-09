import { Controller, 
    Get, 
    Req, 
    Post, 
    Body, UseGuards, HttpCode, UseInterceptors, Headers } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../../common/authguards/jwt-auth-guard"
import { IdempotencyInterceptor } from "../idempotency/idempotency.interceptor";


@Controller("wallet")
export class WalletController {

    constructor(private walletService: WalletService) {}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Post("deposit")
    @HttpCode(201)
    async deposit(@Req() req, 
                @Body() body, 
                @Headers('Idempotency-Key') idempotencyKey: string 
            ) {
        return this.walletService.deposit(
            req.user.id, 
            body.amount,
            idempotencyKey,
        ); 
    }   

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMyWallet(@Req() req) {
        return this.walletService.findByUserId(req.user.id);
    }
}
