import {
  Controller,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const { username, password } = body;
    const loginResult = await this.userService.login(username, password);
    return loginResult; // Retorna o token e o sub
  }

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; isAdmin: boolean },
  ) {
    const { email, password, isAdmin } = body;
    const result = await this.userService.register(
      email,
      password,
      email,
      isAdmin,
    );
    return result; // Retorna uma mensagem de sucesso e os dados do usuário
  }

  @Post('confirm')
  async confirm(@Body() body: { username: string; confirmationCode: string }) {
    const { username, confirmationCode } = body;
    const result = await this.userService.confirmUser(
      username,
      confirmationCode,
    );
    return result; // Retorna uma mensagem de sucesso ou de erro
  }

  @Get()
  async listUsers(): Promise<User[]> {
    return this.userService.listUsers();
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: Partial<User>,
  ): Promise<User> {
    return this.userService.updateUser(id, updateData);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    await this.userService.deleteUser(id);
    return { message: 'Usuário excluído com sucesso' };
  }
}
