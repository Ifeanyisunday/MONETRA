import { Injectable } from "@nestjs/common";
import { ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { User } from "./user.entity";
import { CreateUserDto } from "../dtos/user-dto/create-user.dto";
import * as bcrypt from "bcrypt";
import { WalletService } from "../wallets/wallet.service";

@Injectable()
export class UsersService {

 constructor(
  @InjectRepository(User)
  private usersRepo: Repository<User>,
  private dataSource: DataSource,
  private walletService: WalletService

 ) {}

async create(createUserDto: CreateUserDto) {

  const { username, email, password, phoneNumber } = createUserDto;

  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {

    // 1️⃣ Check if user already exists
    const existingUser = await queryRunner.manager.findOne(User, {
      where: [
        { email },
        { phoneNumber }
      ]
    });

    if (existingUser) {
      throw new ConflictException(
        "User with this email or phone number already exists"
      );
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Create user
    const user = queryRunner.manager.create(User, {
      username,
      email,
      password: hashedPassword,
      phoneNumber
    });

    const savedUser = await queryRunner.manager.save(user);

    const savedWallet = await this.walletService.createWallet(savedUser.id);

    const accountNumber = savedWallet.accountNumber

    const { password: _, ...userData } = savedUser;

    return {
      ...userData,
      accountNumber
    };

  } catch (err) {

    await queryRunner.rollbackTransaction();

    throw new ConflictException(
      err.message || "User creation failed"
    );

  } finally {

    await queryRunner.release();

  }

}

  
  
  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }


}