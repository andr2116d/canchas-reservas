import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { RELOJ } from '../../../src/compartido/aplicacion/reloj.port';
import type { RolUsuario } from '../../../src/compartido/dominio/rol-usuario';
import {
  CONFIGURACION,
  leerConfiguracion,
} from '../../../src/compartido/infraestructura/configuracion/configuracion';
import { configurarApp } from '../../../src/compartido/infraestructura/http/configurar-app';
import { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { USOS_DE_ADICIONAL } from '../../../src/modulos/adicionales/aplicacion/usos-de-adicional.port';
import { ADICIONAL_REPOSITORY } from '../../../src/modulos/adicionales/dominio/adicional.repository';
import { REGLA_DE_CANCELACION_REPOSITORY } from '../../../src/modulos/cancelacion/dominio/regla-de-cancelacion.repository';
import { ESCUCHA_DE_CAMBIOS } from '../../../src/modulos/disponibilidad/aplicacion/escucha-de-cambios.port';
import { EscuchaDeCambiosDePrueba } from '../../disponibilidad/dobles/escucha-de-cambios-de-prueba';
import { OCUPACION_DEL_DIA } from '../../../src/modulos/disponibilidad/aplicacion/ocupacion-del-dia.port';
import { OcupacionDePrueba } from '../../disponibilidad/dobles/ocupacion-de-prueba';
import { CATALOGO_DEL_CLUB } from '../../../src/modulos/club/aplicacion/catalogo-del-club.port';
import { CatalogoDePrueba } from '../../club/dobles/catalogo-de-prueba';
import { ADELANTO_REPOSITORY } from '../../../src/modulos/adelanto/dominio/adelanto.repository';
import { RESERVAS_DE_CANCHA } from '../../../src/modulos/canchas/aplicacion/reservas-de-cancha.port';
import { BLOQUEO_REPOSITORY } from '../../../src/modulos/canchas/dominio/bloqueo.repository';
import { CANCHA_REPOSITORY } from '../../../src/modulos/canchas/dominio/cancha.repository';
import { HISTORIAL_REPOSITORY } from '../../../src/modulos/historial/dominio/historial.repository';
import { HORARIO_REPOSITORY } from '../../../src/modulos/horario/dominio/horario.repository';
import {
  type SesionValida,
  ValidarSesionUseCase,
} from '../../../src/modulos/sesiones/aplicacion/validar-sesion.use-case';
import { TARIFA_REPOSITORY } from '../../../src/modulos/tarifas/dominio/tarifa.repository';
import { RECEPCIONISTA_REPOSITORY } from '../../../src/modulos/usuarios/dominio/recepcionista.repository';
import { USUARIO_REPOSITORY } from '../../../src/modulos/usuarios/dominio/usuario.repository';
import { EnMemoriaAdelantoRepository } from '../../adelanto/dobles/en-memoria-adelanto.repository';
import { EnMemoriaAdicionalRepository } from '../../adicionales/dobles/en-memoria-adicional.repository';
import { UsosDeAdicionalDePrueba } from '../../adicionales/dobles/usos-de-adicional-de-prueba';
import { EnMemoriaReglaDeCancelacionRepository } from '../../cancelacion/dobles/en-memoria-regla-de-cancelacion.repository';
import { EnMemoriaBloqueoRepository } from '../../canchas/dobles/en-memoria-bloqueo.repository';
import { EnMemoriaCanchaRepository } from '../../canchas/dobles/en-memoria-cancha.repository';
import { ReservasDeCanchaDePrueba } from '../../canchas/dobles/reservas-de-cancha-de-prueba';
import { EnMemoriaHistorialRepository } from '../../historial/dobles/en-memoria-historial.repository';
import { EnMemoriaHorarioRepository } from '../../horario/dobles/en-memoria-horario.repository';
import { EnMemoriaTarifaRepository } from '../../tarifas/dobles/en-memoria-tarifa.repository';
import { EnMemoriaRecepcionistaRepository } from '../../usuarios/dobles/en-memoria-recepcionista.repository';
import { EnMemoriaUsuarioRepository } from '../../usuarios/dobles/en-memoria-usuario.repository';
import { RelojDePrueba } from '../dobles/reloj-de-prueba';
import { BANDEJA_DE_SALIDA } from '../../../src/modulos/correo/aplicacion/bandeja-de-salida.port';
import { ENVIADOR_DE_CORREO } from '../../../src/modulos/correo/aplicacion/enviador-de-correo.port';
import { HOJA_REPOSITORY } from '../../../src/modulos/reclamos/dominio/hoja.repository';
import { EnMemoriaBandejaDeSalida } from '../../correo/dobles/en-memoria-bandeja-de-salida';
import { EnviadorDeCorreoDePrueba } from '../../correo/dobles/enviador-de-correo-de-prueba';
import { EnMemoriaHojaRepository } from '../../reclamos/dobles/en-memoria-hoja.repository';

const CLAVE = Buffer.alloc(32, 7).toString('base64');

/** Cómo llega la sesión de la prueba: por defecto, una cuenta al día. */
type Sesion = Partial<
  Pick<
    SesionValida,
    | 'usuarioId'
    | 'requiereCambiarContrasena'
    | 'requiereCompletarDatos'
    | 'cambioOmitido'
  >
>;

function crearDobles() {
  const reloj = new RelojDePrueba();
  return {
    bandeja: new EnMemoriaBandejaDeSalida(reloj),
    enviador: new EnviadorDeCorreoDePrueba(),
    hojas: new EnMemoriaHojaRepository(),
    canchas: new EnMemoriaCanchaRepository(),
    bloqueos: new EnMemoriaBloqueoRepository(),
    reservas: new ReservasDeCanchaDePrueba(),
    adicionales: new EnMemoriaAdicionalRepository(),
    usos: new UsosDeAdicionalDePrueba(),
    tarifas: new EnMemoriaTarifaRepository(),
    horario: new EnMemoriaHorarioRepository(),
    cancelacion: new EnMemoriaReglaDeCancelacionRepository(),
    adelanto: new EnMemoriaAdelantoRepository(),
    ocupacion: new OcupacionDePrueba(),
    escucha: new EscuchaDeCambiosDePrueba(),
    catalogo: new CatalogoDePrueba(),
    historial: new EnMemoriaHistorialRepository(),
    usuarios: new EnMemoriaUsuarioRepository(),
    recepcionistas: new EnMemoriaRecepcionistaRepository(),
    reloj,
  };
}

type Dobles = ReturnType<typeof crearDobles>;

/** Cada puerto de salida apunta a su doble en memoria. */
function dobleDeCadaPuerto(dobles: Dobles): [symbol, unknown][] {
  return [
    [RELOJ, dobles.reloj],
    [BANDEJA_DE_SALIDA, dobles.bandeja],
    [ENVIADOR_DE_CORREO, dobles.enviador],
    [HOJA_REPOSITORY, dobles.hojas],
    [CANCHA_REPOSITORY, dobles.canchas],
    [BLOQUEO_REPOSITORY, dobles.bloqueos],
    [RESERVAS_DE_CANCHA, dobles.reservas],
    [ADICIONAL_REPOSITORY, dobles.adicionales],
    [USOS_DE_ADICIONAL, dobles.usos],
    [TARIFA_REPOSITORY, dobles.tarifas],
    [HORARIO_REPOSITORY, dobles.horario],
    [REGLA_DE_CANCELACION_REPOSITORY, dobles.cancelacion],
    [ADELANTO_REPOSITORY, dobles.adelanto],
    [OCUPACION_DEL_DIA, dobles.ocupacion],
    [ESCUCHA_DE_CAMBIOS, dobles.escucha],
    [CATALOGO_DEL_CLUB, dobles.catalogo],
    [HISTORIAL_REPOSITORY, dobles.historial],
    [USUARIO_REPOSITORY, dobles.usuarios],
    [RECEPCIONISTA_REPOSITORY, dobles.recepcionistas],
  ];
}

/** Sesiones simuladas: el token de la cookie lleva directo a la sesión que eligió la prueba. */
function simularSesiones() {
  const sesiones = new Map<string, SesionValida>();
  const validador = {
    ejecutar: (token?: string) =>
      Promise.resolve(token ? sesiones.get(token) : undefined),
  };
  function como(rol: RolUsuario, sesion: Sesion = {}): string {
    const token = `token-${sesiones.size + 1}`;
    sesiones.set(token, {
      rol,
      usuarioId: 1,
      tokenHash: `hash-${token}`,
      requiereCambiarContrasena: false,
      cambioOmitido: false,
      requiereCompletarDatos: false,
      venceEn: new Date('2099-01-01T00:00:00.000Z'),
      ...sesion,
    });
    return `sesion=${token}`;
  }
  return { validador, como };
}

/**
 * Levanta la API como un componente: controladores, validación, guardias, pipes y
 * filtros reales, pero con los repositorios en memoria y sin base de datos. La
 * sesión se simula: `como(rol)` devuelve la cookie de una cuenta de ese rol.
 */
export async function crearComponenteDePrueba() {
  const dobles = crearDobles();
  const { validador, como } = simularSesiones();
  let constructor = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CONFIGURACION)
    .useValue(
      leerConfiguracion({
        DATABASE_URL: 'postgresql://sin:base@localhost:1/sin_base',
        CLAVE_CIFRADO: CLAVE,
        CLAVE_HASH: CLAVE,
        NODE_ENV: 'test',
      }),
    )
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(ValidarSesionUseCase)
    .useValue(validador);
  for (const [puerto, doble] of dobleDeCadaPuerto(dobles))
    constructor = constructor.overrideProvider(puerto).useValue(doble);
  const app = (
    await constructor.compile()
  ).createNestApplication<NestExpressApplication>({
    logger: false,
    bodyParser: false,
  });
  configurarApp(app);
  await app.init();
  return { app, api: () => request(app.getHttpServer()), como, dobles };
}
