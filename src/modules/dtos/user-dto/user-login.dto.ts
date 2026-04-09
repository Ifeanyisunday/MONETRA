import { IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class UserLoginDto {

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(20)
    password!: string;
}