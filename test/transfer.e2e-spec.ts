import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing"; 
import { TestAppModule } from "./test-app.module";



describe("transfer", () => {
    let app: INestApplication;
    let token: string
    let user1: any
    let user2: any
    
    
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

      const user1Email = `sender${Date.now()}@gmail.com`;
      const user2Email = `receiver${Date.now()}@gmail.com`;

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
      
                
              user2 = await request(app.getHttpServer())
                        .post("/auth/register")
                        .send({
                          email: user2Email,
                          password: "password2",
                          username: `user2${Date.now()}`,
                          phoneNumber: `080${Math.floor(Math.random() * 900000000 + 100000000)}`,
                        });
              
                    console.log("USER RESPONSE:", user2.body);
      
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


    it("should transfer money", async () => {

        // 3. deposit into THAT wallet
        const res = await request(app.getHttpServer())
          .post("/wallet/deposit")
          .set("Authorization", `Bearer ${token}`)
          .send({
            amount: 1000
          });
                 
          console.log("DEPOSIT RESPONSE:", res.status, res.body); // 👈 ADD THIS
      
            // transfer
        const transfer = await request(app.getHttpServer())
          .post("/money/transfer")
          .set("Authorization", `Bearer ${token}`)
          .send({
            senderId:user1.body.id,
            recipientAccountNumber: user2.body.wallet.accountNumber,
              amount: 200
            });
      
            console.log("TRANSFER RESPONSE:", transfer.status, transfer.body);
    
            console.log("user2:", transfer.body.recipient)
      
          expect(transfer.status).toBe(201);
          expect(transfer.body.message).toBe("Transfer successful");
          expect(transfer.body.sender.balance).toBe(800)
          expect(transfer.body.recipient.balance).toBe(200)
        });
    

    
});
