import { IsUUID, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateTransferDto {


    @IsString()
    @IsNotEmpty()
    recipientAccountNumber!: string;

    @IsNumber()
    @IsNotEmpty()
    amount!: number;

}