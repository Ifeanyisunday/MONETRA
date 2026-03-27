import { Injectable } from '@nestjs/common';
import { OutboxService } from '../outbox/outbox.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';


@Injectable()
export class NotificationService {
    constructor(
        @InjectQueue('notifications')
        private readonly notificationQueue: Queue,
        private outbox: OutboxService
    ) {}

    async notifyUser(userId: string, message: string) {
        await this.notificationQueue.add('send-user-notification', {
            userId,
            message,
        });
    }
}