import { Injectable } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { OutboxService } from "./outbox.service"
import { QueueService } from "../queue/queue.service"

@Injectable()
export class OutboxProcessor{

 constructor(
  private readonly outboxService:OutboxService,
  private queue:QueueService
 ){}

 @Cron("*/5 * * * * *")
 async process(){

  const events = await this.outboxService.getUnprocessed()

  for(const event of events){

   await this.queue.publish(event.eventType, event.payload)

   await this.outboxService.markProcessed(event.id)

  }

 }

}