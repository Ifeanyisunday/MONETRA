import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Idempotency } from "./idempotency.entity";

@Injectable()
export class IdempotencyService {

  constructor(
    @InjectRepository(Idempotency)
    private idempotencyRepo: Repository<Idempotency>
  ) {}

  async createOrGet(key: string) {
    try {
      const record = this.idempotencyRepo.create({
        key,
        status: "processing",
      });

      return await this.idempotencyRepo.save(record);
    } catch (error) {
      // Key already exists → fetch it
      return this.idempotencyRepo.findOne({ where: { key } });
    }
  }
  
  async complete(key: string, response: any) {
    await this.idempotencyRepo.update(
      { key },
      {
        response: JSON.stringify(response),
        status: "completed",
      }
    );
  }

}