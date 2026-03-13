import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Wallet } from "../wallets/wallet.entity";
import { UsersService } from "./users.service";

@Module({
 imports: [TypeOrmModule.forFeature([User, Wallet])],
 providers: [UsersService],
 exports: [UsersService],
})
export class UsersModule {}