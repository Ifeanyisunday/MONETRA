import { Controller, Post, Body } from "@nestjs/common";
import { CreateUserDto } from "../dtos/user-dto/create-user.dto";
import { UserLoginDto } from "../dtos/user-dto/user-login.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {

 constructor(private authService: AuthService) {}

    @Post("register")
    async register(@Body() createUserDto: CreateUserDto) {

        return this.authService.register(createUserDto);

    }


    @Post("login")
    async login(@Body() userLoginDto: UserLoginDto) {

        return this.authService.login(userLoginDto);

    }

}