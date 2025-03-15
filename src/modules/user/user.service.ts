import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

// Defina o UserPoolId e ClientId
const poolData = {
  UserPoolId: 'us-east-2_DgdFLYxCp',
  ClientId: '1bntc0f7f78vqf58hdkbrm50aj',
};

const userPool = new CognitoUserPool(poolData);

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async login(username: string, password: string): Promise<any> {
    const userData = {
      Username: username,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    return new Promise(async (resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: async (result) => {
          const idToken = result.getIdToken().getJwtToken();
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          const userSub = payload.sub; // O sub do Cognito

          try {
            // 🔹 Busca o usuário no banco pelo email
            let user = await this.userRepository.findOne({
              where: { email: username },
            });

            if (!user) {
              return reject(
                new UnauthorizedException('Usuário não encontrado.'),
              );
            }

            // 🔹 Se o usuário não tiver o sub salvo, atualiza no banco
            if (!user.sub) {
              user.sub = userSub;
              await this.userRepository.save(user);
            }

            resolve({
              token: idToken,
              sub: userSub,
              isAdmin: user.isAdmin ?? false,
            });
          } catch (err) {
            console.error('Erro ao consultar banco:', err);
            return reject(
              new UnauthorizedException('Erro ao consultar o banco de dados.'),
            );
          }
        },
        onFailure: (err) => {
          return reject(
            new UnauthorizedException(
              err.message || 'Erro ao autenticar usuário',
            ),
          );
        },
      });
    });
  }

  async register(
    username: string,
    password: string,
    email: string,
    isAdmin: boolean,
  ): Promise<any> {
    console.log('Username recebido:', username); // Verifique se o valor de username está sendo recebido

    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email,
      }),
    ];

    return new Promise((resolve, reject) => {
      userPool.signUp(username, password, attributeList, [], (err, result) => {
        if (err) {
          if ('code' in err && err.code === 'UsernameExistsException') {
            reject(new ConflictException('Este usuário já está registrado.'));
          } else {
            reject(
              new UnauthorizedException(
                err.message || 'Erro ao registrar usuário.',
              ),
            );
          }
        } else {
          // O usuário foi registrado no Cognito, mas ainda não confirmado

          // Agora vamos salvar o usuário no banco de dados
          const newUser = this.userRepository.create({
            email, // Salva o email do usuário
            username, // Salva o username do usuário
            password, // Atenção: Não é recomendado salvar a senha em texto plano
            sub: null, // O "sub" será obtido após a confirmação do usuário
            isAdmin: isAdmin,
            confirmationCode: false, // O usuário ainda não está confirmado
          });

          this.userRepository
            .save(newUser)
            .then((user) => {
              resolve({
                message: 'Usuário registrado no banco de dados.',
                user,
              });
            })
            .catch((error) => {
              console.error('Erro ao salvar no banco:', error);
              reject(
                new ConflictException(
                  'Erro ao salvar o usuário no banco de dados.',
                ),
              );
            });
        }
      });
    });
  }

  async confirmUser(username: string, confirmationCode: string): Promise<any> {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
        if (err) {
          reject(new UnauthorizedException('Erro ao confirmar o usuário.'));
        } else {
          // Após a confirmação, vamos obter a sessão do usuário e o idToken
          cognitoUser.getSession((err, session) => {
            if (err) {
              reject(
                new UnauthorizedException('Erro ao obter sessão do Cognito.'),
              );
            } else {
              const idToken = session.getIdToken().getJwtToken(); // Obtém o ID Token (JWT)
              const payload = JSON.parse(atob(idToken.split('.')[1])); // Decodifica o payload do token
              const sub = payload.sub; // O "sub" (identificador único do usuário) do payload

              const email = payload.email; // Obtém o email do payload

              // Agora podemos salvar o usuário no banco de dados
              const newUser = this.userRepository.create({
                email: username,
                sub: null, // Antes era o sub do Cognito
                password: 'NÃO ARMAZENAR SENHA EM TEXTO PLANO', // Atenção: Não armazene a senha em texto plano
              });

              this.userRepository
                .save(newUser)
                .then((user) => {
                  resolve({
                    message: 'Usuário confirmado e salvo no banco de dados.',
                    user,
                  });
                })
                .catch((error) => {
                  reject(
                    new ConflictException(
                      'Erro ao salvar o usuário no banco de dados.',
                    ),
                  );
                });
            }
          });
        }
      });
    });
  }

  async listUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.userRepository.findOne({ where: { id } });
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
