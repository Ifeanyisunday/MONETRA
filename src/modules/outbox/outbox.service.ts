import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outbox } from './outbox.entity';

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepo: Repository<Outbox>,
  ) {}

  // Create a new event in the outbox table
  async createEvent(eventType: string, payload: any) {
    const event = this.outboxRepo.create({
      eventType,
      payload,
      processed: false, // ensure default
      createdAt: new Date(),
    });
    return this.outboxRepo.save(event);
  }

  // Get all events that have not yet been processed
  async getUnprocessed() {
    return this.outboxRepo.find({
      where: { processed: false },
      order: { createdAt: 'ASC' }, // process oldest first
    });
  }

  // Mark an event as processed after successful publishing
  async markProcessed(id: string) {
    return this.outboxRepo.update(id, { processed: true, processedAt: new Date() });
  }
}