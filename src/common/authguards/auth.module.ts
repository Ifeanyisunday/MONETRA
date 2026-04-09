import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { UsersModule } from "../../modules/users/users.module"
import { JwtStrategy } from "./jwt.strategy"
import { JwtAuthGuard } from "./jwt-auth-guard";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";


@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        const expiresIn = configService.get<string>("JWT_EXPIRATION") || "3600s";

        return {
          secret,
          signOptions: { expiresIn: expiresIn as any }, // ✅ cast to satisfy type
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}