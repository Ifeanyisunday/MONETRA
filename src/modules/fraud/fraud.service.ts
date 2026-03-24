import { Injectable } from "@nestjs/common";

@Injectable()
export class FraudService {

  async checkTransaction(amount: number): Promise<boolean> {

    // simple rule
    if (amount > 500000) {
      console.log("⚠️ Fraud alert: large transaction");
      return true;
    }

    return false;
  }

}
