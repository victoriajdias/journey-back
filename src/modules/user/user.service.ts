import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserDto } from './dto/user.dto';
import { v4 as uuidv4 } from 'uuid'; // Caso queira gerar um sub temporário

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // async createUser({ name, email, password }: UserDto): Promise<User> {
  //   const user = this.userRepository.create({ name, email, password, sub: '' });
  //   return this.userRepository.save(user);
  // }

  async findBySub(sub: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { sub }, // Buscando pelo sub que foi salvo no banco de dados
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  async saveUser(createUserDto: UserDto) {
    const { email, password, sub } = createUserDto;

    // Verificar se o email já existe no banco
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new Error('Este email já está registrado.');
    }

    // Usar o sub do Cognito, não o UUID gerado automaticamente
    const newUser = this.userRepository.create({
      email,
      password,
      sub, // Sub do Cognito
    });

    await this.userRepository.save(newUser);
    return newUser;
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { sub: userId } });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user.isAdmin;
  }

  async getUserProfile(userId: string): Promise<User> {
    // Busca o usuário pelo ID e retorna os dados, incluindo isAdmin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return user; // Retorna o usuário, incluindo o campo isAdmin
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getUserById(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateUser(id: string, name: string, email: string): Promise<User> {
    await this.userRepository.update(id, { name, email });
    return this.getUserById(id);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
