// jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    console.log('Cabeçalho Authorization:', request.headers['authorization']); // Logando o cabeçalho Authorization
    return super.canActivate(context);
  }
}
