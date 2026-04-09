import { IsUUID, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateTransferDto {

    // @IsUUID()
    // @IsNotEmpty()
    // senderId: string;

    @IsString()
    @IsNotEmpty()
    recipientAccountNumber!: string;

    @IsNumber()
    @IsNotEmpty()
    amount!: number;

}