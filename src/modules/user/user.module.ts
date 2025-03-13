import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from '../entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/jwt-strategy';
import { JwtAuthGuard } from 'src/jwt-auth-guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy], // Removi JwtAuthGuard daqui
  exports: [UserService, PassportModule], // Caso queira usar em outros módulos
})
export class UserModule {}
