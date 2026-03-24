import { Controller, Post, Body, UseGuards, HttpCode, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../../modules/dtos/user-dto/create-user.dto"
import { JwtAuthGuard } from "./jwt-auth-guard";
import { UserLoginDto } from "../../modules/dtos/user-dto/user-login.dto"



@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}


  @Post("register")
      async register(@Body() createUserDto: CreateUserDto) {
  
          return this.authService.register(createUserDto);
  
      }


  @Post("login")
  @HttpCode(200)
  async login(@Body() loginDto: UserLoginDto) {

    return this.authService.login(loginDto);
  }
}
