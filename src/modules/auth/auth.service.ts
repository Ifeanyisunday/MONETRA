import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "../dtos/user-dto/create-user.dto";
import { UserLoginDto } from "../dtos/user-dto/user-login.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {

    constructor(private usersService: UsersService) {}


    async register(createUserDto: CreateUserDto) {

        const hashPassword = await bcrypt.hash(createUserDto.password, 10);

        const userData = {
            ...createUserDto,
            password: hashPassword,
        };

        return this.usersService.create(userData);

    }

    
    async login(userLoginDto: UserLoginDto) {

        const user = await this.usersService.findByEmail(userLoginDto.email);

        if(!user || user.password !== userLoginDto.password) throw new UnauthorizedException()
        
        return {message:"Welcome back!", userId:user.username}

    }

}