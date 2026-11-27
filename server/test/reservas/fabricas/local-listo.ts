import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import {
  fechaEnLima,
  sumarAFecha,
} from '../../../src/compartido/dominio/momento-en-lima';
import { unaCanchaValida } from '../../canchas/fabricas/datos-cancha';
import { cookieDe } from '../../compartido/soporte/cookie-de-sesion';
import { sesionDeAdministrador } from '../../compartido/soporte/sesiones-de-prueba';
import { unJugadorValido } from '../../usuarios/fabricas/datos-registro-jugador';

const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

export const dentroDe = (dias: number) =>
  sumarAFecha(fechaEnLima(new Date()), { dias });
export const MANANA = () => dentroDe(1);

/** Registra el jugador número `n` (con correo y documento propios) y devuelve su cookie. */
export async function unJugadorMas(
  app: NestExpressApplication,
  n: number,
): Promise<string> {
  const registro = await request(app.getHttpServer())
    .post('/api/jugadores')
    .send(
      unJugadorValido({
        correo: `jugador.${n}@gmail.com`,
        numeroDocumento: String(40000000 + n),
      }),
    )
    .expect(201);
  return cookieDe(registro);
}

type Guardar = (
  metodo: 'post' | 'put',
  ruta: string,
  cuerpo: object,
) => Promise<unknown>;

/** Horario, tarifa de fútbol 5, adelanto y regla de cancelación. */
async function definirLasReglas(guardar: Guardar) {
  await guardar('put', '/api/horario', {
    inicioDeLaNoche: '18:00',
    dias: DIAS.map((dia) => ({
      dia,
      abierto: true,
      abre: '16:00',
      cierra: '22:00',
    })),
  });
  await guardar('put', '/api/tarifas/FUTBOL_5', {
    precioDia: '60',
    precioNoche: '80',
    duracionDelTurno: '1',
    ofreceTurnoCorto: false,
  });
  await guardar('put', '/api/adelanto', { porcentaje: '50' });
  await guardar('put', '/api/cancelacion/regla', {
    rangos: [
      { desdeHoras: '24', porcentaje: '100', ofreceCredito: true },
      { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
    ],
  });
}

/**
 * Abre todos los días de 16:00 a 22:00 (noche desde las 18:00), fútbol 5 a S/ 60 de día
 * y S/ 80 de noche con 50 % de adelanto, una regla de cancelación, dos canchas y un balón.
 */
export async function prepararElLocal(app: NestExpressApplication) {
  const administrador = await sesionDeAdministrador(app);
  const guardar = async (
    metodo: 'post' | 'put',
    ruta: string,
    cuerpo: object,
  ) =>
    (
      await request(app.getHttpServer())
        [metodo](ruta)
        .set('Cookie', administrador)
        .send(cuerpo)
        .expect((r) => {
          if (r.status >= 300) throw new Error(`${ruta} respondió ${r.status}`);
        })
    ).body as unknown;
  await definirLasReglas(guardar);
  const canchas = (await guardar('post', '/api/canchas', {
    canchas: [
      unaCanchaValida({ nombre: 'Cancha 1' }),
      unaCanchaValida({ nombre: 'Cancha 2' }),
    ],
  })) as { id: number }[];
  const balon = (await guardar('post', '/api/adicionales', {
    nombre: 'Balón',
    descripcion: 'Número 5',
    precio: '35',
  })) as { id: number };
  return { administrador, guardar, canchas, balonId: balon.id };
}

/** Lo que manda la pantalla para separar el turno de las 19:00 de mañana en la cancha dada. */
export const separarALas19 = (canchaId: number, cambios: object = {}) => ({
  canchaId,
  fecha: MANANA(),
  desde: '19:00',
  precio: '80.00',
  adelanto: '40.00',
  adicionales: [],
  ...cambios,
});
