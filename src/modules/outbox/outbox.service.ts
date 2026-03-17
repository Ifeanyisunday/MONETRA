import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Outbox } from "./outbox.entity"

@Injectable()
export class OutboxService {

  constructor(
    @InjectRepository(Outbox)
    private outboxRepo: Repository<Outbox>
  ){}

  async createEvent(eventType: string, payload: any) {
    const event = this.outboxRepo.create({ eventType, payload })
    return this.outboxRepo.save(event)
  }

  async getUnprocessed() {
    return this.outboxRepo.find({ where: { processed: false } })
  }

  async markProcessed(id: string) {
    return this.outboxRepo.update(id, { processed: true })
  }

}