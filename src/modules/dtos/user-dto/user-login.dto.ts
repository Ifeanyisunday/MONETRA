import { IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class UserLoginDto {

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(20)
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
        message: 'Password must contain at least one letter and one number',
    })
    password: string;
}