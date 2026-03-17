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



// import { Injectable } from "@nestjs/common"

// @Injectable()
// export class FraudService{

//  async checkTransfer(amount:number){

//   if(amount > 10000){
//    return {flag:true}
//   }

//   return {flag:false}

//  }

// }