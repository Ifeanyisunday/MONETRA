import 'reflect-metadata';
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing"; 
import { TestAppModule } from "./test-app.module";
import { NotificationService } from '../src/modules/notifications/notification.service';

describe("Fintech Flow (E2E)", () => {
  let app: INestApplication;
  let token: string;
  let user1: any;
  let user2: any;

  const idempotencyKey = `test-key-${Date.now()}`;

  let notificationService: any;

  beforeAll(async () => {
    const mockNotificationService = {
        notifyUser: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideProvider(NotificationService)
      .useValue(mockNotificationService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    notificationService = mockNotificationService;

    const user1Email = `sender${Date.now()}@gmail.com`;
    const user2Email = `receiver${Date.now()}@gmail.com`;

    // Register users
    user1 = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: user1Email,
        password: "password1",
        username: `user1${Date.now()}`,
        phoneNumber: `080${Math.floor(Math.random() * 900000000 + 100000000)}`,
      });

    user2 = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: user2Email,
        password: "password2",
        username: `user2${Date.now()}`,
        phoneNumber: `080${Math.floor(Math.random() * 900000000 + 100000000)}`,
      });

    // Login user1
    const loginUser1 = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: user1Email, password: "password1" });

    token = loginUser1.body.access_token;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("should complete full fintech flow including idempotency and notifications", async () => {
    // 1️⃣ Deposit
    const deposit = await request(app.getHttpServer())
      .post("/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 1000 });

    expect(deposit.status).toBe(201);
    expect(deposit.body.wallet.balance).toBe(1000);

    // ✅ Notification for deposit
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
        user1.body.id,
        expect.stringContaining('credited with $1000')
    );

    // 2️⃣ First Transfer
    const transfer1 = await request(app.getHttpServer())
      .post("/money/transfer")
      .set("Authorization", `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        senderId: user1.body.id,
        recipientAccountNumber: user2.body.wallet.accountNumber,
        amount: 200,
      });

    expect(transfer1.status).toBe(201);
    expect(transfer1.body.message).toBe('Transfer successful');
    expect(transfer1.body.sender.balance).toBe(800);
    expect(transfer1.body.recipient.balance).toBe(200);

    // ✅ Notifications for transfer
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
        user1.body.id,
        expect.stringContaining('sent $200')
    );

    expect(notificationService.notifyUser).toHaveBeenCalledWith(
        user2.body.id,
        expect.stringContaining('received $200')
    );

    // 3️⃣ Retry transfer with same idempotency key → should NOT create duplicates
    const transfer2 = await request(app.getHttpServer())
      .post("/money/transfer")
      .set("Authorization", `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        senderId: user1.body.id,
        recipientAccountNumber: user2.body.wallet.accountNumber,
        amount: 200,
      });

    expect(transfer2.status).toBe(201);
    expect(transfer2.body.message).toBe('Transfer successful');
    expect(transfer2.body.sender.balance).toBe(800); // balance unchanged
    expect(transfer2.body.recipient.balance).toBe(200);

    // 4️⃣ Check transaction history for sender
    const senderHistory = await request(app.getHttpServer())
      .get(`/transactions/${user1.body.wallet.id}/history`) // ✅ matches controller
      .set("Authorization", `Bearer ${token}`);

    expect(senderHistory.status).toBe(200); // ✅ GET returns 200
    expect(senderHistory.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "debit", amount: 200 }),
      ])
    );

    // 5️⃣ Check transaction history for recipient
    const recipientHistory = await request(app.getHttpServer())
      .get(`/transactions/${user2.body.wallet.id}/history`) // ✅ fix route
      .set("Authorization", `Bearer ${token}`);

    expect(recipientHistory.status).toBe(200);
    expect(recipientHistory.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "credit", amount: 200 }),
      ])
    );
  });
});
