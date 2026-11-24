import { Module, type Provider } from '@nestjs/common';
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
import { CambiarMiContrasenaUseCase } from './aplicacion/cambiar-mi-contrasena.use-case';
import { ActualizarMiCuentaUseCase } from './aplicacion/actualizar-mi-cuenta.use-case';
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
import { ReglasDeCorreo } from './dominio/reglas-de-correo';
import {
  CONTEXTO_DE_CUENTAS,
  type ContextoDeCuentas,
} from './aplicacion/contexto-de-cuentas';
import { PROVIDERS_DE_RECEPCIONISTAS } from './recepcionistas.providers';
import { CuentaController } from './infraestructura/http/cuenta.controller';
import { DatosPropiosController } from './infraestructura/http/datos-propios.controller';
import { ActividadDeLaCuentaController } from './infraestructura/http/actividad-de-la-cuenta.controller';
import { ConsultarMisAccesosUseCase } from './aplicacion/consultar-mis-accesos.use-case';
import { CambiarMiTipoDeDocumentoUseCase } from './aplicacion/cambiar-mi-tipo-de-documento.use-case';
import { CompletarMisDatosUseCase } from './aplicacion/completar-mis-datos.use-case';
import { InicioDeSesionController } from './infraestructura/http/inicio-de-sesion.controller';
import { RecepcionistasController } from './infraestructura/http/recepcionistas.controller';
import { CuentaDeRecepcionistaController } from './infraestructura/http/cuenta-de-recepcionista.controller';
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
    DatosPropiosController,
    ActividadDeLaCuentaController,
    InicioDeSesionController,
    RecepcionistasController,
    CuentaDeRecepcionistaController,
  ],
  exports: [RegistrarPersonalUseCase],
  providers: [
    ...PROVIDERS_DE_RECEPCIONISTAS,
    LimiteDeInicios,
    Argon2HasheadorContrasenaAdapter,
    { provide: ACCESO_REPOSITORY, useClass: PrismaAccesoRepository },
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    {
      provide: HASHEADOR_CONTRASENA,
      useExisting: Argon2HasheadorContrasenaAdapter,
    },
    {
      provide: ReglasDeCorreo,
      useFactory: (configuracion: Configuracion) =>
        new ReglasDeCorreo(configuracion.dominioCorporativo),
      inject: [CONFIGURACION],
    },
    {
      provide: RegistrarJugadorUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        hasheador: HasheadorContrasena,
        abrirSesion: AbrirSesionUseCase,
        contexto: ContextoDeCuentas,
      ) =>
        new RegistrarJugadorUseCase(usuarios, hasheador, abrirSesion, contexto),
      inject: [
        USUARIO_REPOSITORY,
        HASHEADOR_CONTRASENA,
        AbrirSesionUseCase,
        CONTEXTO_DE_CUENTAS,
      ],
    },
    {
      provide: CONTEXTO_DE_CUENTAS,
      useFactory: (reloj: Reloj, correos: ReglasDeCorreo) => ({
        reloj,
        correos,
      }),
      inject: [RELOJ, ReglasDeCorreo],
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
        contexto: ContextoDeCuentas,
      ) =>
        new IniciarSesionUseCase(
          accesos,
          (texto, hash) => hasheador.verificar(texto, hash),
          abrirSesion,
          contexto,
        ),
      inject: [
        ACCESO_REPOSITORY,
        Argon2HasheadorContrasenaAdapter,
        AbrirSesionUseCase,
        CONTEXTO_DE_CUENTAS,
      ],
    },
    ...[CambiarContrasenaTemporalUseCase, CambiarMiContrasenaUseCase].map(
      (CasoDeUso): Provider => ({
        provide: CasoDeUso,
        useFactory: (
          accesos: AccesoRepository,
          hasheador: Argon2HasheadorContrasenaAdapter,
          abrirSesion: AbrirSesionUseCase,
        ) =>
          new CasoDeUso(
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
      }),
    ),
    {
      provide: ActualizarMiCuentaUseCase,
      useFactory: (usuarios: UsuarioRepository, contexto: ContextoDeCuentas) =>
        new ActualizarMiCuentaUseCase(usuarios, contexto),
      inject: [USUARIO_REPOSITORY, CONTEXTO_DE_CUENTAS],
    },
    {
      provide: ConsultarMisAccesosUseCase,
      useFactory: (accesos: AccesoRepository) =>
        new ConsultarMisAccesosUseCase(accesos),
      inject: [ACCESO_REPOSITORY],
    },
    ...[CompletarMisDatosUseCase, CambiarMiTipoDeDocumentoUseCase].map(
      (CasoDeUso) => ({
        provide: CasoDeUso,
        useFactory: (usuarios: UsuarioRepository, reloj: Reloj) =>
          new CasoDeUso(usuarios, reloj),
        inject: [USUARIO_REPOSITORY, RELOJ],
      }),
    ),
    {
      provide: RegistrarPersonalUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        hasheador: HasheadorContrasena,
        correos: ReglasDeCorreo,
        reloj: Reloj,
      ) => new RegistrarPersonalUseCase(usuarios, hasheador, correos, reloj),
      inject: [USUARIO_REPOSITORY, HASHEADOR_CONTRASENA, ReglasDeCorreo, RELOJ],
    },
  ],
})
export class UsuariosModule {}
