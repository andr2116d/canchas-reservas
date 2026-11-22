import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  HASHEADOR_CONTRASENA,
  type HasheadorContrasena,
} from './aplicacion/hasheador-contrasena.port';
import { ConsultarCuentaUseCase } from './aplicacion/consultar-cuenta.use-case';
import { RegistrarJugadorUseCase } from './aplicacion/registrar-jugador.use-case';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from './dominio/usuario.repository';
import { AbrirSesionUseCase, SesionesModule } from '../sesiones/api-sesiones';
import { CuentaController } from './infraestructura/http/cuenta.controller';
import { JugadoresController } from './infraestructura/http/jugadores.controller';
import { PrismaUsuarioRepository } from './infraestructura/persistencia/prisma-usuario.repository';
import { Argon2HasheadorContrasenaAdapter } from './infraestructura/seguridad/argon2-hasheador-contrasena.adapter';

/** Cuentas de usuario: registro de jugadores y consulta de la propia cuenta. */
@Module({
  imports: [SesionesModule],
  controllers: [JugadoresController, CuentaController],
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
        reloj: Reloj,
        abrirSesion: AbrirSesionUseCase,
      ) => new RegistrarJugadorUseCase(usuarios, hasheador, reloj, abrirSesion),
      inject: [
        USUARIO_REPOSITORY,
        HASHEADOR_CONTRASENA,
        RELOJ,
        AbrirSesionUseCase,
      ],
    },
    {
      provide: ConsultarCuentaUseCase,
      useFactory: (usuarios: UsuarioRepository) =>
        new ConsultarCuentaUseCase(usuarios),
      inject: [USUARIO_REPOSITORY],
    },
  ],
})
export class UsuariosModule {}
