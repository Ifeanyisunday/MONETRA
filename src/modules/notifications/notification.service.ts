import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class NotificationService {
    constructor(
        private notificationGateway: NotificationGateway,
        private outbox: OutboxService
    ) {}

    async notifyUser(userId: string, message: string) {
        //send via Websocket
        this.notificationGateway.sendNotification(userId, message);

    }
}