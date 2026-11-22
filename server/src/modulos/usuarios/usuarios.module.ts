import { Module } from '@nestjs/common';
import {
  HASHEADOR_CONTRASENA,
  type HasheadorContrasena,
} from './aplicacion/hasheador-contrasena.port';
import { RegistrarJugadorUseCase } from './aplicacion/registrar-jugador.use-case';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from './dominio/usuario.repository';
import { JugadoresController } from './infraestructura/http/jugadores.controller';
import { PrismaUsuarioRepository } from './infraestructura/persistencia/prisma-usuario.repository';
import { Argon2HasheadorContrasenaAdapter } from './infraestructura/seguridad/argon2-hasheador-contrasena.adapter';

/** Cuentas de usuario: registro de jugadores. */
@Module({
  controllers: [JugadoresController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    {
      provide: HASHEADOR_CONTRASENA,
      useClass: Argon2HasheadorContrasenaAdapter,
    },
    {
      provide: RegistrarJugadorUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        hasheador: HasheadorContrasena,
      ) => new RegistrarJugadorUseCase(usuarios, hasheador),
      inject: [USUARIO_REPOSITORY, HASHEADOR_CONTRASENA],
    },
  ],
})
export class UsuariosModule {}
