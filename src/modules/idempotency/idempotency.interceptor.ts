import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { IdempotencyService } from "./idempotency.service";

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {

  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {

    const request = context.switchToHttp().getRequest();
    const key = request.headers["idempotency-key"];

    if (!key) return next.handle();

    const existing = await this.idempotencyService.find(key);

    if (existing) {
      return new Observable((observer) => {
        observer.next(JSON.parse(existing.response));
        observer.complete();
      });
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.idempotencyService.save(key, response);
      })
    );
  }
}