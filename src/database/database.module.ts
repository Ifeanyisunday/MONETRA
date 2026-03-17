import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;

@Module({
    
  imports: [
    // ConfigModule.forRoot({
    //   isGlobal: true,
    // }),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     type: "postgres",
    //     host: configService.get<string>("DB_HOST", "localhost"),
    //     port: configService.get<number>("DB_PORT", 5432),
    //     username: configService.get<string>("DB_USER", "postgres"),
    //     password: configService.get<string>("DB_PASS", "password"),
    //     database: configService.get<string>("DB_NAME", "fintech"),
    //     autoLoadEntities: true,
    //     synchronize: true,
    //   }),
    // }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true
    }),
  ],
})
export class DatabaseModule {}