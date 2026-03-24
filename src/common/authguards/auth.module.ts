import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { UsersModule } from "../../modules/users/users.module"
import { JwtStrategy } from "./jwt.strategy"
import { JwtAuthGuard } from "./jwt-auth-guard";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, // ⚠️ use env in production
      signOptions: { expiresIn: "1h" },
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}