import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';
import { UserDTO, UserRO } from './user.dto';

@Injectable()
export class UserService {

    constructor(
      @InjectRepository(UserEntity)
      private userRepository: Repository<UserEntity>
    ) { }

    async showAll(): Promise<UserRO[]> {
        const users = await this.userRepository.find({
            relations: ['ideas', 'bookmarks']
        });

        // While returning, we sanitize them w/ toResponseObject method implemented in UserEntity
        return users.map((user) => {
            return user.toResponseObject(false);
        });
    }
    async login(data: UserDTO): Promise<UserRO> {
        const { username, password } = data;
        const user = await this.userRepository.findOne({
            where: {
                username
            }
        });

        if (!user || !(await user.comparePassword(password))) {
            throw new HttpException('Invalid Username/Password', HttpStatus.UNAUTHORIZED);
        }

        // When execution reaches this part, login is successful
        return user.toResponseObject();
    }
    async register(data: UserDTO): Promise<UserRO> {
        const { username } = data;

        let user = await this.userRepository.findOne({
            where: {
                username
            }
        });

        if (user) {
            throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
        }

        user = await this.userRepository.create(data);
        await this.userRepository.save(user);
        return user.toResponseObject();
    }
}
