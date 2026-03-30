import { Injectable, Inject, } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { OutboxService } from "./outbox.service"
import { QueueService } from "../queue/queue.service"
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from "bull";
import { Processor, Process } from '@nestjs/bull';



@Processor('outbox')
@Injectable()
export class OutboxProcessor{

//  constructor(
//   private readonly outboxService:OutboxService,
//    @Inject("QueueService") private queue: any
//  ){}

//  @Cron("*/5 * * * * *")
//  async process(){

//   const events = await this.outboxService.getUnprocessed()

//   for(const event of events){

//    await this.queue.publish(event.eventType, event.payload)

//    await this.outboxService.markProcessed(event.id)

//   }

//  }

  constructor(
    private outboxService: OutboxService,
    @InjectQueue('notifications')
    private notificationQueue: Queue,
  ) {}

  @Process('process')
  async handleOutbox() {
    const events = await this.outboxService.getUnprocessed();

    for (const event of events) {
      if (event.eventType === "USER_NOTIFICATION") {
        await this.notificationQueue.add('send', event.payload);
      }

      await this.outboxService.markProcessed(event.id);
    }
  }

}