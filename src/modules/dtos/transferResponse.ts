import { IsNumber, IsPositive, IsString } from 'class-validator';

export class TransferResponse {

    @IsString()
    message: string;

    sender: any;

    recipent: any;
}