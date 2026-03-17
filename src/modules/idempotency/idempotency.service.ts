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

  async find(key: string) {
    return this.idempotencyRepo.findOne({ where: { key } });
  }

  async save(key: string, response: any) {
    const record = this.idempotencyRepo.create({
      key,
      response: JSON.stringify(response)
    });
    return this.idempotencyRepo.save(record);
  }

}