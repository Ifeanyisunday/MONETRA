import { Injectable, Logger } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly queueService: QueueService,
  ) {}

  // Main function: process all unprocessed outbox events
  async processPendingMessages() {
    const events = await this.outboxService.getUnprocessed();

    for (const event of events) {
      try {
        // Publish to RabbitMQ using your QueueService
        await this.queueService.publish(event.eventType, event.payload);

        // Mark as processed in DB
        await this.outboxService.markProcessed(event.id);

        this.logger.log(`Event ${event.id} (${event.eventType}) processed successfully.`);
      } catch (err) {
          if (err instanceof Error) {
            console.log(
              `Failed to process event ${event.id} (${event.eventType}): ${err.message}`,
            );
          } else {
            console.log(
              `Failed to process event ${event.id} (${event.eventType}): Unknown error`,
            );
          }
        }
    }
  }
}