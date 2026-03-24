import { Controller, Post, Body, UseGuards, Req, HttpCode } from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { CreateTransferDto } from "../dtos/create-transfer.dto";
import { JwtAuthGuard } from "../../common/authguards/jwt-auth-guard"

@Controller("money")
export class TransferController {
  constructor(private transferService: TransferService) {}

@UseGuards(JwtAuthGuard)
@Post("transfer")
@HttpCode(201) 
transfer(@Req() req, @Body() body: { recipientAccountNumber: string, amount: number }) {
  return this.transferService.transfer(
    req.user.id,
    body.recipientAccountNumber,
    body.amount
  );
}
}