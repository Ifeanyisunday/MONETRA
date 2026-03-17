import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Idempotency } from "./idempotency.entity";
import { IdempotencyService } from "./idempotency.service";
import { IdempotencyInterceptor } from "./idempotency.interceptor";

@Module({
  imports: [TypeOrmModule.forFeature([Idempotency])],
  providers: [IdempotencyService, IdempotencyInterceptor],
  exports: [IdempotencyService, IdempotencyInterceptor]
})
export class IdempotencyModule {}
