import { Controller, Post, Body } from "@nestjs/common";
import { CreateUserDto } from "../dtos/create-user.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {

 constructor(private authService: AuthService) {}

 @Post("register")
 async register(@Body() createUserDto: CreateUserDto) {

  return this.authService.register(createUserDto);

 }

}