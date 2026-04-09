import { Processor, Process } from '@nestjs/bull';
import { NotificationGateway } from './notification.gateway';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bull';

@Processor('notifications')
@Injectable()
export class NotificationProcessor {

  constructor(
    private notificationGateway: NotificationGateway
  ) {}

  @Process('send-notification')
  async handleNotification(job: Job<{ userId: string; message: string }>) {
    const { userId, message } = job.data;
    console.log(`Sending notification to user ${userId}: ${message}`);

    // Send via WebSocket
    this.notificationGateway.sendNotification(userId, message);
  }
}