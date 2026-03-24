import { Entity, 
        PrimaryGeneratedColumn, 
        Column, 
        CreateDateColumn } from "typeorm";

@Entity()
export class User {

 @PrimaryGeneratedColumn("uuid")
 id: string;

 @Column()
 username: string;

 @Column({ unique: true })
 email: string;
 
 @Column({ unique: true })
 phoneNumber: string;
 
 @Column({ unique: true })
 password: string;

}