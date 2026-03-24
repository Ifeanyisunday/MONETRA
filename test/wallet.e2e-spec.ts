import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing"; 
import { TestAppModule } from "./test-app.module";



describe("Wallet", () => {
    let app: INestApplication;
    let token: string
    let user1: any
    
    
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();


      const user1Email = `sender${Date.now()}@gmail.com`;
      // const user2Email = `receiver${Date.now()}@gmail.com`;


        // Register + login user
        user1 = await request(app.getHttpServer())
          .post("/auth/register")
          .send({
            email: user1Email,
            password: "password1",
            username: `user1${Date.now()}`,
            phoneNumber: `080${Math.floor(Math.random() * 900000000 + 100000000)}`,
          });

          console.log("USER RESPONSE:", user1.body);


        const loginUser1 = await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: user1Email,
            password: "password1",
          });

        console.log("LOGIN RESPONSE:", loginUser1.body, loginUser1.status)

        token = loginUser1.body.access_token;

      
        
    });

    afterAll(async () => {
        await app.close();
    });


  it("should deposit money", async () => {

      // 3. deposit into THAT wallet
      const res = await request(app.getHttpServer())
        .post("/wallet/deposit")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 1000
        });


        console.log("DEPOSIT RESPONSE:", res.status, res.body); // 👈 ADD THIS


      expect(res.status).toBe(201);
      expect(res.body.balance).toBeGreaterThan(0);

  });
      
});
