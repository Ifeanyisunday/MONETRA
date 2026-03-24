import { forwardRef, Module } from "@nestjs/common";
import { NotificationGateway } from "./notification.gateway";
import { NotificationService } from "./notification.service";
import { OutboxModule } from "../outbox/outbox.module";

@Module({
  imports: [OutboxModule],
  providers: [
    NotificationGateway,
    NotificationService
  ],
  exports: [
    NotificationService
  ]
})
export class NotificationModule {}