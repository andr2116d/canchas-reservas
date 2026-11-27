import { PorcentajeDeAdelanto } from '../../../src/modulos/adelanto/api-adelanto';
import {
  ConsultarDisponibilidadUseCase,
  type MapaDelDia,
} from '../../../src/modulos/disponibilidad/aplicacion/consultar-disponibilidad.use-case';
import { construirHorario } from '../../../src/modulos/horario/api-horario';
import { construirTarifa } from '../../../src/modulos/tarifas/api-tarifas';
import { EnMemoriaAdelantoRepository } from '../../adelanto/dobles/en-memoria-adelanto.repository';
import { RelojDePrueba } from '../../compartido/dobles/reloj-de-prueba';
import { EnMemoriaHorarioRepository } from '../../horario/dobles/en-memoria-horario.repository';
import { EnMemoriaTarifaRepository } from '../../tarifas/dobles/en-memoria-tarifa.repository';
import { OcupacionDePrueba } from '../dobles/ocupacion-de-prueba';

export const MANANA = '2026-11-25';
const GUARDADO = { guardadoEn: new Date(0), guardadoPor: 'Valeria León' };
const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];
export const enLima = (fecha: string, hora: string) =>
  new Date(`${fecha}T${hora}:00-05:00`);

/** El local abre de 16:00 a 22:00 y la noche empieza a las 18:00; fútbol 5 tiene tarifa, fútbol 7 no. */
export function prepararElLocal({
  ahora = enLima('2026-11-24', '15:20'),
} = {}) {
  const tarifas = new EnMemoriaTarifaRepository();
  const horarios = new EnMemoriaHorarioRepository();
  const adelantos = new EnMemoriaAdelantoRepository();
  const ocupacion = new OcupacionDePrueba();
  horarios.versiones.push({
    ...GUARDADO,
    horario: construirHorario({
      inicioDeLaNoche: '18:00',
      dias: DIAS.map((dia) => ({
        dia,
        abierto: true,
        abre: '16:00',
        cierra: '22:00',
      })),
    }),
  });
  tarifas.versiones.push({
    guardadaEn: new Date(0),
    guardadaPor: 'Valeria León',
    tarifa: construirTarifa('FUTBOL_5', {
      precioDia: '60',
      precioNoche: '80',
      duracionDelTurno: '1',
      ofreceTurnoCorto: false,
    }),
  });
  adelantos.versiones.push({
    guardadoEn: new Date(0),
    guardadoPor: 'Valeria León',
    porcentaje: PorcentajeDeAdelanto.crear('50'),
  });
  ocupacion.canchas.push(
    { id: 1, nombre: 'Cancha 1', tipo: 'FUTBOL_5', tieneIluminacion: true },
    { id: 2, nombre: 'Cancha 2', tipo: 'FUTBOL_5', tieneIluminacion: false },
    { id: 3, nombre: 'Cancha 3', tipo: 'FUTBOL_7', tieneIluminacion: true },
  );
  const consultar = new ConsultarDisponibilidadUseCase({
    tarifas,
    horarios,
    adelantos,
    ocupacion,
    reloj: new RelojDePrueba(ahora),
  });
  return { consultar, ocupacion, adelantos, horarios };
}

export function futbol5(mapa: MapaDelDia) {
  const tipo = mapa.tipos.find((t) => t.tipo === 'FUTBOL_5');
  if (tipo?.estado !== 'CON_TURNOS') throw new Error('Sin turnos de fútbol 5');
  return tipo;
}

export const estadoEn = (mapa: MapaDelDia, desde: string, canchaId: number) =>
  futbol5(mapa)
    .turnos.find((t) => t.desde === desde)
    ?.canchas.find((c) => c.canchaId === canchaId)?.estado;
