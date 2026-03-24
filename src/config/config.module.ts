import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config";

@Module({
  imports: [
    ConfigModule.forRoot({   
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}`,
        '.env'
      ],
      load: [configuration],
    })
  ]
})
export class AppConfigModule {}