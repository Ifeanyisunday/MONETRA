import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler
} from "@nestjs/common";
import { Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
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
    const key = request.headers['idempotency-key'] as string;

    if (!key) return next.handle();

    const { isNew, record } = await this.idempotencyService.createOrGet(key);

    if (!isNew && record.response) {
      return new Observable((observer) => {
        observer.next(record.response);
        observer.complete();
      });
    }

    return next.handle().pipe(
      mergeMap(async (response) => {
        await this.idempotencyService.complete(key, response);
        return response;
      })
    );
  }
}