import { Controller, Post, Body, UseGuards, Req, HttpCode, 
  UseInterceptors, Headers } from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { CreateTransferDto } from "../dtos/create-transfer.dto";
import { JwtAuthGuard } from "../../common/authguards/jwt-auth-guard"
import { IdempotencyInterceptor } from "../idempotency/idempotency.interceptor"; 



@Controller("money")
export class TransferController {
  constructor(private transferService: TransferService) {}


@UseGuards(JwtAuthGuard)
@UseInterceptors(IdempotencyInterceptor)
@Post("transfer")
@HttpCode(201)
async transfer(@Req() req, @Body() body: CreateTransferDto) {
  return this.transferService.transfer(
    req.user.userId, // comes from JWT payload
    body.recipientAccountNumber,
    body.amount,
    req.idempotencyKey, // ✅ provided by interceptor
  );
}


}