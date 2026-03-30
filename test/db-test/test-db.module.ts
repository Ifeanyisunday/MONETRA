import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("database.host"),
        port: config.get<number>("database.port"),
        username: config.get<string>("database.username"),
        password: String(config.get<string>("database.password") || ''),
        database: config.get<string>("database.name"),
        autoLoadEntities: true,
        synchronize: true,
        dropSchema: true,
        // extra: {
        //   max: 1,
        // },
      }),
    })
  ],
})
export class TestDatabaseModule {}