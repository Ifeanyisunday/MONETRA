import { Controller, Post, Body, UseGuards, Req, HttpCode, UseInterceptors } from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { CreateTransferDto } from "../dtos/create-transfer.dto";
import { JwtAuthGuard } from "../../common/authguards/jwt-auth-guard"
import { IdempotencyInterceptor } from "../idempotency/idempotency.interceptor"; 
import { BadRequestException } from "@nestjs/common";


@Controller("money")
export class TransferController {
  constructor(private transferService: TransferService) {}


@Post('transfer')
@UseGuards(JwtAuthGuard)
@HttpCode(201)
async transfer(@Req() req, @Body() body: CreateTransferDto) {
  const userId = req.user.userId;
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    throw new BadRequestException("Idempotency-Key header is required");
  }

  // Call service
  const result = await this.transferService.transfer(
    userId,
    body.recipientAccountNumber,
    body.amount,
    idempotencyKey
  );

  return result;
}
}