import { IsEmail, IsPhoneNumber, IsString, MinLength, Matches, MaxLength } from "class-validator";

export class CreateUserDto {

    @IsString()
    username: string;

    @IsEmail({})
    email: string;

    @IsPhoneNumber()
    phoneNumber: string;

    @IsString()
    @MinLength(6)
    @MaxLength(20)
    password: string;
    
}