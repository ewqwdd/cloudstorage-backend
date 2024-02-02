import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.repository.findOne({
      where: {
        email,
      },
    });
    if (!user) throw new ForbiddenException('Incorrect credentials');

    const match = bcrypt.compareSync(password, user.password);

    if (!match) throw new ForbiddenException('Incorrect credentials');
    return user;
  }

  async createUser(email: string, password: string) {
    const hashed = bcrypt.hashSync(password, 10);
    const user = await this.repository.save({
      email,
      password: hashed,
    });

    return user;
  }

  async findById(id: number) {
    const user = await this.repository.findOne({
      where: {
        id,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRtHash(id: number, rt: string) {
    const hash = bcrypt.hashSync(rt, 10);
    const upd = await this.repository.update(id, { rtHash: hash });
    return upd;
  }
}
