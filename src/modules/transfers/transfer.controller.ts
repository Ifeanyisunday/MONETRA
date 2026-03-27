import { Controller, Post, Body, UseGuards, Req, HttpCode, UseInterceptors } from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { CreateTransferDto } from "../dtos/create-transfer.dto";
import { JwtAuthGuard } from "../../common/authguards/jwt-auth-guard"
import { IdempotencyInterceptor } from "../idempotency/idempotency.interceptor"; 
import { BadRequestException } from "@nestjs/common";
import { TransferResponse } from "../dtos/transferResponse";


@Controller("money")
export class TransferController {
  constructor(private transferService: TransferService) {}


@UseGuards(JwtAuthGuard)
@Post("transfer")
@HttpCode(201) 
@UseInterceptors(IdempotencyInterceptor)
transfer(@Req() req, @Body() body: CreateTransferDto): Promise<any> {
  
  const userId = req.user.id;
  const idempotencyKey = req.headers["idempotency-key"] ||
   req.headers["Idempotency-key"];

  if (!idempotencyKey) {
    throw new BadRequestException("Idempotency-Key header is required");
  }
  
  return this.transferService.transfer(
    userId,
    body.recipientAccountNumber,
    body.amount,
    idempotencyKey as string
  );
}
}