import { forwardRef, Module } from "@nestjs/common";
import { NotificationGateway } from "./notification.gateway";
import { NotificationService } from "./notification.service";
import { OutboxModule } from "../outbox/outbox.module";
import { getQueueToken } from "@nestjs/bull";

@Module({
  imports: [OutboxModule],
  providers: [
    NotificationGateway,
    {
      provide: getQueueToken("notifications"),
      useFactory: () => ({
      add: async () => {},
    }),
    },
    {
      provide: NotificationService,
      useFactory: (queue: any) => {
        return {
          notifyUser: async (userId: string, message: string) => {
            console.log(`📩 Notify ${userId}: ${message}`);

            await queue.add("notification", {
              userId,
              message,
            });
          },
        };
      },
      inject: [getQueueToken("notifications")],
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}