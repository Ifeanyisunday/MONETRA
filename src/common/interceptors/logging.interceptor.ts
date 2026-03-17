import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common'

import { Observable, tap } from 'rxjs'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

    const now = Date.now()

    return next.handle().pipe(
      tap(() =>
        console.log(`Request took ${Date.now() - now}ms`)
      )
    )

  }

}

// Why Redis locking?
// Why double-entry ledger?
// Why outbox pattern?
// Why idempotency?