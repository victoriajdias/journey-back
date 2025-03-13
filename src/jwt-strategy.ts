import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { Strategy } from 'passport-custom';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private client = jwksClient({
    jwksUri:
      'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_5q69zNtfv/.well-known/jwks.json',
  });

  constructor() {
    super();
  }

  async validate(req: any): Promise<any> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      throw new Error('Token JWT não encontrado no cabeçalho Authorization.');
    }

    const decodedToken: any = jwt.decode(token, { complete: true });

    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      throw new Error('KID não encontrado no token JWT.');
    }

    const kid = decodedToken.header.kid;
    const key = await this.getKey(kid);

    return new Promise((resolve, reject) => {
      jwt.verify(token, key, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
          return reject(new Error('Token inválido.'));
        }
        resolve(decoded);
      });
    });
  }

  private async getKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.getSigningKey(kid, (err, key) => {
        if (err) {
          return reject(err);
        }
        resolve(key.getPublicKey());
      });
    });
  }
}
