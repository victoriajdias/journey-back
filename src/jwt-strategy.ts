import { Injectable } from '@nestjs/common';
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtStrategy {
  private client = jwksClient({
    jwksUri:
      'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_5q69zNtfv/.well-known/jwks.json',
  });

  // Função para obter a chave pública usando o KID
  async getKey(kid: string): Promise<string> {
    console.log(`Buscando chave pública para o KID: ${kid}`); // Log do KID que estamos buscando
    return new Promise((resolve, reject) => {
      this.client.getSigningKey(kid, (err, key) => {
        if (err) {
          console.error('Erro ao obter chave pública:', err); // Logando erro ao obter chave
          return reject(err);
        }
        console.log(`Chave pública obtida para o KID: ${kid}`); // Log da chave obtida
        resolve(key.getPublicKey()); // Retorna a chave pública
      });
    });
  }

  // Função para validar o token JWT
  async validateToken(token: string): Promise<any> {
    console.log('Decodificando o token JWT'); // Log antes de decodificar o token
    const decodedToken: any = jwt.decode(token, { complete: true });

    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      console.error('KID não encontrado no token'); // Log se o KID não for encontrado
      throw new Error('KID não encontrado no token');
    }

    const kid = decodedToken.header.kid;
    console.log(`KID extraído do token: ${kid}`); // Log do KID extraído

    try {
      // Obter a chave pública usando o KID
      const publicKey = await this.getKey(kid);

      console.log('Validando token com a chave pública obtida'); // Log antes da validação do token
      // Validando o token com a chave pública
      const verifiedToken = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });

      console.log('Token JWT validado com sucesso'); // Log do sucesso na validação
      return verifiedToken; // Retorna o token validado
    } catch (err) {
      console.error('Erro na validação do token:', err); // Log de erro caso a validação falhe
      throw new Error('Token inválido');
    }
  }
}
