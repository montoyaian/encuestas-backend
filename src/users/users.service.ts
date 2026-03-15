import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/userdto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { StandardResponse } from 'src/common/standard-response';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  getUserById(id: number) {
    return this.findOne(id);
  }

  async create(body: CreateUserDto) {
    await this.ensureEmailUnique(body.email);
    try {
      const newUser = this.userRepository.create(body);
      await this.userRepository.save(newUser);
      return new StandardResponse('Usuario creado exitosamente');
    } catch {
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async update(id: number, body: UpdateUserDto) {
    if (body.email) {
      await this.ensureEmailUnique(body.email, id);
    }
    const user = await this.findOne(id);
    this.userRepository.merge(user, body);
      await this.userRepository.save(user);
      return new StandardResponse('Usuario actualizado exitosamente');
  }

  async remove(id: number) {
    try {
      await this.userRepository.delete(id);
      return new StandardResponse('Usuario eliminado exitosamente');
    } catch {
      throw new BadRequestException('Error deleting user');
    }
  }

  async findbyEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    return user;
  }

  private async ensureEmailUnique(email: string, userId?: number) {
    const qb = this.userRepository.createQueryBuilder('user')
      .select(['user.id'])
      .where('user.email = :email', { email });
    if (userId) {
      qb.andWhere('user.id != :userId', { userId });
    }
    const existing = await qb.getOne();
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }
  }
}
