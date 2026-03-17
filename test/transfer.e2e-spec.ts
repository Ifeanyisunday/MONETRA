describe("Transfer", () => {

  it("should transfer money", async () => {

    const res = await request("http://localhost:3000")
      .post("/transfers")
      .send({
        senderId: "user1",
        recipientAccountNumber: "1234567890",
        amount: 500
      });

    expect(res.status).toBe(201);

  });

});