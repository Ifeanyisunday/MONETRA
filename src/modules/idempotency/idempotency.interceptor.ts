// import {
//   Injectable, NestInterceptor, ExecutionContext, CallHandler
// } from "@nestjs/common";
// import { Observable } from "rxjs";
// import { mergeMap } from "rxjs/operators";
// import { IdempotencyService } from "./idempotency.service";
// import { BadRequestException, ConflictException } from "@nestjs/common";

// @Injectable()
// export class IdempotencyInterceptor implements NestInterceptor {
//   constructor(private readonly idempotencyService: IdempotencyService) {}

//   async intercept(
//     context: ExecutionContext,
//     next: CallHandler
//   ): Promise<Observable<any>> {
//     const request = context.switchToHttp().getRequest();
//     const key = request.headers['idempotency-key'] as string;

//     if (!key) return next.handle();

//     const { isNew, record } = await this.idempotencyService.createOrGet(key);

//     if (!isNew && record.response) {
//       return new Observable((observer) => {
//         observer.next(record.response);
//         observer.complete();
//       });
//     }

//     return next.handle().pipe(
//       mergeMap(async (response) => {
//         await this.idempotencyService.complete(key, response);
//         return response;
//       })
//     );
//   }
// }



import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { IdempotencyService } from "./idempotency.service";
import { randomUUID } from "crypto";

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // ✅ Always ensure a key exists
    let key = request.headers['idempotency-key'] as string;
    if (!key) {
      key = randomUUID(); // generate a new UUID if missing
      request.headers['idempotency-key'] = key;
    }

    // ✅ Attach to request so controller can access it
    request.idempotencyKey = key;

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
