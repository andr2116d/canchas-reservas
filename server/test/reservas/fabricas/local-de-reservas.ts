import { ReglaDeCancelacion } from '../../../src/modulos/cancelacion/api-cancelacion';
import { ReservarTurnoUseCase } from '../../../src/modulos/reservas/aplicacion/reservar-turno.use-case';
import { ResumirReservaUseCase } from '../../../src/modulos/reservas/aplicacion/resumir-reserva.use-case';
import type { TurnoDelLocal } from '../../../src/modulos/reservas/aplicacion/turnos-del-local.port';
import { EnMemoriaReglaDeCancelacionRepository } from '../../cancelacion/dobles/en-memoria-regla-de-cancelacion.repository';
import { RelojDePrueba } from '../../compartido/dobles/reloj-de-prueba';
import { EnMemoriaReservaRepository } from '../dobles/en-memoria-reserva.repository';
import {
  AvisosDeReservaDePrueba,
  CatalogoDePrueba,
  CodigosDePrueba,
  TitularesDePrueba,
} from '../dobles/puertos-de-reserva-de-prueba';
import { TurnosDelLocalDePrueba } from '../dobles/turnos-del-local-de-prueba';

export const JUGADOR = 7;
export const enLima = (fecha: string, hora: string) =>
  new Date(`${fecha}T${hora}:00-05:00`);

/** Cancha 1, sábado 28 de 19:00 a 20:00, a S/ 80 con S/ 40 de adelanto (50 %). */
export function unTurnoLibre(
  cambios: Partial<TurnoDelLocal> = {},
): TurnoDelLocal {
  return {
    cancha: {
      id: 1,
      nombre: 'Cancha 1',
      tipo: 'FUTBOL_5',
      tieneIluminacion: true,
    },
    fecha: '2026-11-28',
    desde: '19:00',
    hasta: '20:00',
    inicio: enLima('2026-11-28', '19:00'),
    fin: enLima('2026-11-28', '20:00'),
    precio: '80.00',
    adelanto: { monto: '40.00', porcentaje: 50 },
    libre: true,
    ...cambios,
  };
}

/** Lo que manda la pantalla al separar el turno de `unTurnoLibre`. */
export const unPedido = (
  cambios: Partial<Parameters<ReservarTurnoUseCase['ejecutar']>[0]> = {},
) => ({
  titularId: JUGADOR,
  canchaId: 1,
  fecha: '2026-11-28',
  desde: '19:00',
  precio: '80.00',
  adelanto: '40.00',
  adicionales: [] as number[],
  ...cambios,
});

/** Local listo para reservar: un turno libre, regla de cancelación y un jugador de 31 años. */
export function prepararReservas({
  ahora = enLima('2026-11-27', '10:00'),
  codigos = [] as string[],
} = {}) {
  const turnos = new TurnosDelLocalDePrueba();
  const reglas = new EnMemoriaReglaDeCancelacionRepository();
  const catalogo = new CatalogoDePrueba();
  const titulares = new TitularesDePrueba();
  const reservas = new EnMemoriaReservaRepository();
  const reloj = new RelojDePrueba(ahora);
  turnos.turnos.push(unTurnoLibre());
  reglas.versiones.push({
    id: 3,
    guardadaEn: new Date(0),
    guardadaPor: 'Valeria León',
    regla: ReglaDeCancelacion.crear([
      { desdeHoras: '24', porcentaje: '100', ofreceCredito: true },
      { desdeHoras: '2', porcentaje: '50', ofreceCredito: false },
      { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
    ]),
  });
  catalogo.adicionales.push(
    { id: 11, nombre: 'Balón', descripcion: 'Número 5', precio: '35.00' },
    { id: 12, nombre: 'Chalecos', descripcion: null, precio: '6.00' },
  );
  titulares.cuentas.set(JUGADOR, {
    esJugadorActivo: true,
    fechaNacimiento: '1995-04-10',
  });
  const dependencias = {
    turnos,
    reglas,
    catalogo,
    titulares,
    reservas,
    reloj,
    codigos: new CodigosDePrueba(codigos),
    avisos: new AvisosDeReservaDePrueba(),
  };
  return {
    ...dependencias,
    reservar: new ReservarTurnoUseCase(dependencias),
    resumir: new ResumirReservaUseCase(dependencias),
  };
}
