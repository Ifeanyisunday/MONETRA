import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../../modules/users/users.service"
import { CreateUserDto } from "src/modules/dtos/user-dto/create-user.dto";
import { UserLoginDto } from "../../modules/dtos/user-dto/user-login.dto"

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}



  async register(createUserDto: CreateUserDto) {
          return this.usersService.create(createUserDto);
  
  }


  async validateUser(email: string, password: string) {
      const user = await this.usersService.findByEmail(email);

      if (!user) return null;

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) return null;

      const { password: _, ...result } = user;
      return result;
}


    async login(loginDto: UserLoginDto) {
      
        const user = await this.usersService.findByEmail(loginDto.email);

        if (!user) {
          throw new UnauthorizedException("Invalid credentials");
        }

        const isMatch = await bcrypt.compare(loginDto.password, user.password);

        if (!isMatch) {
          throw new UnauthorizedException("Invalid credentials");
        }

        const payload = {
          sub: user.id,
          email: user.email,
          username: user.username,
        };

        return {
          access_token: this.jwtService.sign(payload),
        };
    }
    
}