import * as request from "supertest";

describe("Wallet", () => {

  it("should deposit money", async () => {

    const res = await request("http://localhost:3000")
      .post("/wallets/deposit")
      .send({
        accountNumber: "1234567890",
        amount: 1000
      });

    expect(res.status).toBe(201);
    expect(res.body.balance).toBeGreaterThan(0);

  });

});