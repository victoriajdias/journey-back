// user.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException, // Importando UseGuards
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from 'src/jwt-auth-guard';
import { User } from '../entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('save')
  @UseGuards(JwtAuthGuard) // Garante que apenas admins podem salvar
  async saveUser(@Req() req, @Body() createUserDto: UserDto) {
    const { email } = createUserDto; // Agora pega o email corretamente

    // 🔹 Verifica se o usuário que está cadastrando é admin
    const isAdmin = await this.userService.isUserAdmin(req.user.sub);
    if (!isAdmin) {
      throw new UnauthorizedException(
        'Apenas administradores podem cadastrar usuários.',
      );
    }

    // 🔹 Criar usuário no banco usando DTO
    const user = await this.userService.saveUser(createUserDto);

    return { message: 'Usuário salvo com sucesso!', user };
  }

  @Get('check-admin')
  @UseGuards(JwtAuthGuard)
  async checkIfAdmin(@Req() req) {
    console.log('Requisição Recebida:', req.headers); // Logando os cabeçalhos da requisição
    console.log('Usuário no Payload do Token:', req.user); // Logando o usuário decodificado

    // Obter o ID do usuário do payload do token
    const userId = req.user.sub;
    console.log('ID do Usuário:', userId);

    // Verificar se o usuário é admin consultando o banco
    const isAdmin = await this.userService.isUserAdmin(userId);
    console.log('Usuário é Admin?', isAdmin); // Logando o status de admin do usuário

    return { isAdmin };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard) // Protegendo a rota com o guard
  async getUserProfile(@Req() req) {
    const userId = req.user.id; // O user deve estar no req, se o token for válido
    return this.userService.getUserProfile(userId);
  }

  @Get(':sub')
  async getUserBySub(@Param('sub') sub: string): Promise<User> {
    return this.userService.findBySub(sub); // Chamando a função para encontrar o usuário pelo sub
  }

  @Get()
  findAll() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UserDto) {
    return this.userService.updateUser(id, body.name, body.email);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.userService.deleteUser(id);
  }
}
