import { Module } from "@nestjs/common"
import { OutboxService } from "./outbox.service"
import { OutboxProcessor } from "./outbox.processor"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Outbox } from "./outbox.entity"
import { QueueModule } from "../queue/queue.module"


@Module({
  imports: [TypeOrmModule.forFeature([Outbox]), QueueModule],
  providers: [OutboxService, OutboxProcessor,
    {
      provide: "QueueService",
      useValue: {
        add: async () => {},
      },
    },
  ],
  exports: [OutboxService]
})
export class OutboxModule {}