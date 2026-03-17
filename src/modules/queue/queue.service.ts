import { Injectable } from "@nestjs/common"
import amqp from "amqplib"

@Injectable()
export class QueueService {

  private connection: amqp.Connection

  async connect() {
    if (!this.connection) {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL)
    }
    return this.connection
  }

  async publish(queue: string, data: any) {
    const conn = await this.connect()
    const channel = await conn.createChannel()
    await channel.assertQueue(queue)
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)))
  }

}