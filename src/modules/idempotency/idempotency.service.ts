import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Idempotency } from "./idempotency.entity";
import { ConflictException } from "@nestjs/common";

@Injectable()
export class IdempotencyService {

  constructor(
    @InjectRepository(Idempotency)
    private idempotencyRepo: Repository<Idempotency>
  ) {}

  async createOrGet(key: string) {
    let record = await this.idempotencyRepo.findOne({ where: { key } });

     if (!record) {
        record = this.idempotencyRepo.create({
          key,
          status: "processing",
        });

        await this.idempotencyRepo.save(record);

        return { isNew: true, record };
    }
    
    if (record.status === "completed") {
      return { isNew: false, record };
    }

    throw new ConflictException('Request already in progress');
  }
  
  async complete(key: string, response: any) {
    await this.idempotencyRepo.update(
      { key },
      {
        response: response,
        status: "completed",
      }
    );
  }

}