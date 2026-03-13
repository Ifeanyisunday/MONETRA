import { Controller, Post, Body } from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { CreateTransferDto } from "../dtos/create-transfer.dto";

@Controller("transfers")
export class TransferController {
  constructor(private transferService: TransferService) {}

  @Post()
  transfer(@Body() body: { creatTransferDto: CreateTransferDto }) {
    return this.transferService.transfer(body.creatTransferDto);
  }
}