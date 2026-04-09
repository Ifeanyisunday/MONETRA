import 'reflect-metadata';
import request from 'supertest';
import { INestApplication, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestAppModule } from './test-app.module';
import { NotificationService } from '../src/modules/notifications/notification.service';
import { getQueueToken } from '@nestjs/bull';
import { DataSource } from 'typeorm';

describe('Fintech Flow (E2E)', () => {
  let app: INestApplication;
  let wallet1: any;
  let wallet2: any;
  let token1: string;
  let token2: string;
  let dataSource: DataSource;

  const mockNotificationService = { notifyUser: jest.fn().mockResolvedValue(undefined) };
  const mockQueue = { add: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideProvider(NotificationService)
      .useValue(mockNotificationService)
      .overrideProvider(getQueueToken('notifications'))
      .useValue(mockQueue)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.dropDatabase();
    await dataSource.synchronize(true);

    const user1Email = `sender${Date.now()}@mail.com`;
    const user2Email = `receiver${Date.now()}@mail.com`;

    const res1 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: user1Email, password: 'pass1', username: 'user1', phoneNumber: '08012345678' });
    wallet1 = res1.body.wallet;


    const login1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user1Email, password: 'pass1' });
    token1 = login1.body.access_token;

    const res2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: user2Email, password: 'pass2', username: 'user2', phoneNumber: '08098765432' });
    wallet2 = res2.body.wallet;

    console.log('Wallet 1:', wallet1);
    console.log('Wallet 2:', wallet2);

    const login2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user2Email, password: 'pass2' });
    token2 = login2.body.access_token;

    mockNotificationService.notifyUser.mockClear();
    mockQueue.add.mockClear();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should deposit, transfer with idempotency, get history, and notify', async () => {
    // --- Deposit to wallet1
    const depositKey = 'deposit-test-key';

    const deposit1 = await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${token1}`)
      .set('Idempotency-Key', depositKey)
      .send({ amount: 1000 });

    expect(deposit1.status).toBe(201);
    // ⚡ Cast balance to number since Postgres decimal returns string
    expect(Number(deposit1.body.wallet.balance)).toBe(1000);
    expect(mockNotificationService.notifyUser).toHaveBeenCalledTimes(1);

    const deposit2 = await request(app.getHttpServer())
    .post('/wallet/deposit')
    .set('Authorization', `Bearer ${token1}`)
    .set('Idempotency-Key', depositKey)
    .send({ amount: 500 });

    
    // Reset notification queue and mock for clean slate before transfer tests
    mockNotificationService.notifyUser.mockClear();
    mockQueue.add.mockClear();


    // Test for insufficient funds
    const transferKey = 'test-key-123';

    const insufficientFundtransfer = await request(app.getHttpServer())
    .post('/money/transfer')
    .set('Authorization', `Bearer ${token1}`)
    .set('Idempotency-Key', transferKey)
    .send({
      recipientAccountNumber: wallet2.accountNumber,
      amount: 5000, // more than wallet1 balance
    });
    expect(insufficientFundtransfer.status).toBe(400);
    expect(insufficientFundtransfer.body.message).toMatch(/insufficient funds/i);
    expect(mockNotificationService.notifyUser).toHaveBeenCalledTimes(0);


    const invalidRecipientAccountNumber = await request(app.getHttpServer())
    .post('/money/transfer')
    .set('Authorization', `Bearer ${token1}`)
    .set('Idempotency-Key', transferKey)
    .send({
      recipientAccountNumber: '00000000000', // nonexistent
      amount: 100,
    });

    expect(invalidRecipientAccountNumber.status).toBe(404);
    expect(invalidRecipientAccountNumber.body.message).toMatch(/recipient wallet not found/i);
    expect(mockNotificationService.notifyUser).toHaveBeenCalledTimes(0);


    // --- First Transfer
    const transfer1 = await request(app.getHttpServer())
      .post('/money/transfer')
      .set('Authorization', `Bearer ${token1}`)
      .set('Idempotency-Key', transferKey)
      .send({
        recipientAccountNumber: wallet2.accountNumber,
        amount: 200,
      });

    console.log(transfer1.body);
    expect(transfer1.status).toBe(201);
    expect(transfer1.body.message).toBe('Transfer successful');
    expect(Number(transfer1.body.sender.balance)).toBe(800);      // ⚡ Cast to number
    expect(Number(transfer1.body.recipient.balance)).toBe(200);   // ⚡ Cast to number
    expect(mockNotificationService.notifyUser).toHaveBeenCalledTimes(2);


    // --- Retry transfer (idempotency)
    console.log('Test Idempotency Key:', transferKey);
    const transfer2 = await request(app.getHttpServer())
      .post('/money/transfer')
      .set('Authorization', `Bearer ${token1}`)
      .set('Idempotency-Key', transferKey)
      .send({
        recipientAccountNumber: wallet2.accountNumber,
        amount: 200,
      });

    expect(transfer2.status).toBe(409); // Idempotent retry
    expect(transfer2.body.message).toMatch(/already processed/i);
    expect(Number(transfer2.body.sender.balance)).toBe(800);
    expect(Number(transfer2.body.recipient.balance)).toBe(200);
    expect(mockNotificationService.notifyUser).toHaveBeenCalledTimes(2);

    
    // --- Transaction history
    const history1 = await request(app.getHttpServer())
      .get(`/transactions/${wallet1.id}/history`)
      .set('Authorization', `Bearer ${token1}`);
    expect(history1.status).toBe(200);
    expect(history1.body.length).toBeGreaterThanOrEqual(2); // deposit + transfer
    console.log('Wallet 1 History:', history1.body);


    const history2 = await request(app.getHttpServer())
      .get(`/transactions/${wallet2.id}/history`)
      .set('Authorization', `Bearer ${token2}`);
    expect(history2.status).toBe(200);
    expect(history2.body.length).toBeGreaterThanOrEqual(1); // received transfer
    console.log('Wallet 2 History:', history2.body);


    // --- Total Notifications after transfer
    expect(mockNotificationService.notifyUser).toHaveBeenCalledTimes(2);
  });
});