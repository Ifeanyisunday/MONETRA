import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersService } from "./users.service";
import { WalletModule } from "../wallets/wallet.module";

@Module({
 imports: [TypeOrmModule.forFeature([User]), WalletModule],
 providers: [UsersService],
 exports: [UsersService],
})
export class UsersModule {}