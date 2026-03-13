import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "../dtos/create-user.dto";
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

    
    async validateUser(email: string, password: string) {

        const user = await this.usersService.findByEmail(email);

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) return null;

        return user;

    }

}