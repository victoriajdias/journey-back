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
  UseGuards, // Importando UseGuards
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from 'src/jwt-auth-guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() body: UserDto) {
    return this.userService.createUser(body);
  }

  @Get('check-admin')
  @UseGuards(JwtAuthGuard)
  checkIfAdmin(@Req() req) {
    console.log('Requisição Recebida:', req.headers); // Logando os cabeçalhos da requisição
    console.log('Usuário no Payload do Token:', req.user); // Logando o usuário decodificado

    const { isAdmin } = req.user;
    console.log('Usuário é Admin?', isAdmin); // Logando o status de admin do usuário

    return { isAdmin };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard) // Protegendo a rota com o guard
  async getUserProfile(@Req() req) {
    const userId = req.user.id; // O user deve estar no req, se o token for válido
    return this.userService.getUserProfile(userId);
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
