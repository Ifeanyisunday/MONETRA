import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { IdempotencyService } from "./idempotency.service";
import { BadRequestException, ConflictException } from "@nestjs/common";

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {

  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(
      context: ExecutionContext,
      next: CallHandler
    ): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest();
      const key = request.headers["idempotency-key"];

      if (!key) return next.handle();

      const record = await this.idempotencyService.createOrGet(key);

      if (!record) {
        throw new BadRequestException("Idempotency record not found");
      }

      if (record.status === "completed" && record.response) {
        return new Observable((observer) => {
          observer.next(JSON.parse(record.response));
          observer.complete();
        });
      }

      if (record.status === "processing") {
        throw new ConflictException("Request already in progress");
      }

      return next.handle().pipe(
        tap(async (response) => {
          await this.idempotencyService.complete(key, response);
        })
      );
    }
}