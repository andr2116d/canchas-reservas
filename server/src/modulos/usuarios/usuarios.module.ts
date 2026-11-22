import { Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  CONFIGURACION,
  type Configuracion,
} from '../../compartido/infraestructura/configuracion/configuracion';
import {
  HASHEADOR_CONTRASENA,
  type HasheadorContrasena,
} from './aplicacion/hasheador-contrasena.port';
import { ConsultarCuentaUseCase } from './aplicacion/consultar-cuenta.use-case';
import { CambiarContrasenaTemporalUseCase } from './aplicacion/cambiar-contrasena-temporal.use-case';
import { IniciarSesionUseCase } from './aplicacion/iniciar-sesion.use-case';
import { RegistrarPersonalUseCase } from './aplicacion/registrar-personal.use-case';
import { RegistrarJugadorUseCase } from './aplicacion/registrar-jugador.use-case';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from './dominio/usuario.repository';
import { AbrirSesionUseCase, SesionesModule } from '../sesiones/api-sesiones';
import {
  ACCESO_REPOSITORY,
  type AccesoRepository,
} from './dominio/acceso.repository';
import { CuentaController } from './infraestructura/http/cuenta.controller';
import { InicioDeSesionController } from './infraestructura/http/inicio-de-sesion.controller';
import { RecepcionistasController } from './infraestructura/http/recepcionistas.controller';
import { JugadoresController } from './infraestructura/http/jugadores.controller';
import { LimiteDeInicios } from './infraestructura/http/limite-de-inicios';
import { PrismaAccesoRepository } from './infraestructura/persistencia/prisma-acceso.repository';
import { PrismaUsuarioRepository } from './infraestructura/persistencia/prisma-usuario.repository';
import { Argon2HasheadorContrasenaAdapter } from './infraestructura/seguridad/argon2-hasheador-contrasena.adapter';

/** Cuentas de usuario: registro de jugadores y consulta de la propia cuenta. */
@Module({
  imports: [SesionesModule],
  controllers: [
    JugadoresController,
    CuentaController,
    InicioDeSesionController,
    RecepcionistasController,
  ],
  exports: [RegistrarPersonalUseCase],
  providers: [
    LimiteDeInicios,
    Argon2HasheadorContrasenaAdapter,
    { provide: ACCESO_REPOSITORY, useClass: PrismaAccesoRepository },
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    {
      provide: HASHEADOR_CONTRASENA,
      useExisting: Argon2HasheadorContrasenaAdapter,
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
    {
      provide: IniciarSesionUseCase,
      useFactory: (
        accesos: AccesoRepository,
        hasheador: Argon2HasheadorContrasenaAdapter,
        abrirSesion: AbrirSesionUseCase,
        configuracion: Configuracion,
      ) =>
        new IniciarSesionUseCase(
          accesos,
          (texto, hash) => hasheador.verificar(texto, hash),
          abrirSesion,
          configuracion.dominioCorporativo,
        ),
      inject: [
        ACCESO_REPOSITORY,
        Argon2HasheadorContrasenaAdapter,
        AbrirSesionUseCase,
        CONFIGURACION,
      ],
    },
    {
      provide: CambiarContrasenaTemporalUseCase,
      useFactory: (
        accesos: AccesoRepository,
        hasheador: Argon2HasheadorContrasenaAdapter,
        abrirSesion: AbrirSesionUseCase,
      ) =>
        new CambiarContrasenaTemporalUseCase(
          accesos,
          hasheador,
          (texto, hash) => hasheador.verificar(texto, hash),
          abrirSesion,
        ),
      inject: [
        ACCESO_REPOSITORY,
        Argon2HasheadorContrasenaAdapter,
        AbrirSesionUseCase,
      ],
    },
    {
      provide: RegistrarPersonalUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        hasheador: HasheadorContrasena,
        configuracion: Configuracion,
      ) =>
        new RegistrarPersonalUseCase(
          usuarios,
          hasheador,
          configuracion.dominioCorporativo,
        ),
      inject: [USUARIO_REPOSITORY, HASHEADOR_CONTRASENA, CONFIGURACION],
    },
  ],
})
export class UsuariosModule {}
