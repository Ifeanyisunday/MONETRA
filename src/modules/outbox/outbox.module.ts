import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxService } from './outbox.service';
import { OutboxProcessor } from './outbox.processor';
import { QueueModule } from '../queue/queue.module';
import { Outbox } from './outbox.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Outbox]), QueueModule],
  providers: [
    OutboxService,
    ...(process.env.NODE_ENV === 'test' ? [] : [OutboxProcessor]), // skip processor in tests
  ],
  exports: [OutboxService],
})
export class OutboxModule {}