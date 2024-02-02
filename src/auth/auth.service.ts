import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types/tokens.type';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signUp({ email, password }: CreateUserDto): Promise<Tokens> {
    const user = await this.usersService.createUser(email, password);

    return this.getTokens(user.id);
  }

  async login(user: UserEntity): Promise<Tokens> {
    const { id } = user;

    return this.getTokens(id);
  }

  async refresh(id: number, rt: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException();
    const compared = bcrypt.compareSync(rt, user.rtHash);
    if (!compared) throw new ForbiddenException();
    const tokens = await this.getTokens(id);
    console.log(tokens);

    return tokens;
  }

  async getTokens(id: number): Promise<Tokens> {
    const tokens = await Promise.all([
      this.jwtService.signAsync(
        { id },
        { expiresIn: '20m', secret: this.config.get('SECRET_KEY') },
      ),
      this.jwtService.signAsync(
        { id },
        { expiresIn: '14d', secret: this.config.get('REFRESH_SECRET_KEY') },
      ),
    ]);
    await this.usersService.updateRtHash(id, tokens[1]);
    return {
      access_token: tokens[0],
      refresh_token: tokens[1],
    };
  }
}
