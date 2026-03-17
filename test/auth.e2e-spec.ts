describe("Auth", () => {

  it("should register user", async () => {

    const res = await request("http://localhost:3000")
      .post("/auth/register")
      .send({
        email: "test@mail.com",
        password: "password123"
      });

    expect(res.status).toBe(201);

  });

});