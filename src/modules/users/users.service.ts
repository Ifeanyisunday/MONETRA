import { Injectable } from "@nestjs/common";
import { ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { User } from "./user.entity";
import { CreateUserDto } from "../dtos/create-user.dto";
import * as bcrypt from "bcrypt";
import { Wallet } from "../wallets/wallet.entity";

@Injectable()
export class UsersService {

 constructor(
  @InjectRepository(User)
  private usersRepo: Repository<User>,

  private dataSource: DataSource,

 ) {}

 async create(createUserDto: CreateUserDto) {

  const { username, email, password, phoneNumber } = createUserDto;

  const existingUser = await this.usersRepo.findOne({
   where: [{ email: createUserDto.email },
          { phoneNumber: createUserDto.phoneNumber }]
  });

  if (existingUser)
    throw new ConflictException("User with this " +  `${createUserDto.email}` +  " already exists");

  // Start a transaction
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
      // 1️⃣ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 2️⃣ Create user entity
      const user = queryRunner.manager.create(User, {
        username,
        email,
        password: hashedPassword,
        phoneNumber,
      });
      const savedUser = await queryRunner.manager.save(user);

      // 3️⃣ Create wallet for user
      const wallet = queryRunner.manager.create(Wallet, {
        userId: savedUser.id,
        accountNumber: phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber,
        balance: 0, // initial balance
      });
      await queryRunner.manager.save(wallet);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return created user (without password)
      const { password: _, ...userData } = savedUser;
      return userData;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new ConflictException(err.message || 'User creation failed');
    } finally {
      await queryRunner.release();
    }

  }

  
  
  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }


}