import {
  enHora,
  enSoles,
  type LineaDeDetalle,
  lineasQueCambian,
} from './linea-de-detalle';

/** Una versión de la tarifa tal como la guarda la vista del historial. */
export interface VersionDeTarifa {
  precioDia: string;
  precioNoche: string;
  duracion: number;
  turnoCorto: boolean;
}

interface DiaDelHorario {
  dia: string;
  apertura: number;
  cierre: number;
  noche: number | null;
}

export interface VersionDelHorario {
  noche: number;
  dias: DiaDelHorario[];
}

export interface RangoDeLaRegla {
  desdeHoras: number;
  porcentaje: number;
  ofreceCredito: boolean;
}

export interface VersionDelAdelanto {
  porcentaje: number;
}

export interface VersionDelPlazo {
  minutos: number;
}

/** El detalle de una versión: la anterior (nula en la primera) y la guardada. */
export interface Versiones<T> {
  antes: T | null;
  despues: T;
}

const CAMPOS_DE_TARIFA: [string, (t: VersionDeTarifa) => string][] = [
  ['Precio de día', (t) => enSoles(t.precioDia)],
  ['Precio de noche', (t) => enSoles(t.precioNoche)],
  ['Duración del turno', (t) => `${t.duracion} h`],
  ['Turno corto', (t) => (t.turnoCorto ? 'Se ofrece' : 'No se ofrece')],
];

export function detalleDeTarifa({
  antes,
  despues,
}: Versiones<VersionDeTarifa>): LineaDeDetalle[] {
  return lineasQueCambian(CAMPOS_DE_TARIFA, antes, despues);
}

const DIAS: [string, string][] = [
  ['LUNES', 'Lunes'],
  ['MARTES', 'Martes'],
  ['MIERCOLES', 'Miércoles'],
  ['JUEVES', 'Jueves'],
  ['VIERNES', 'Viernes'],
  ['SABADO', 'Sábado'],
  ['DOMINGO', 'Domingo'],
];

function textoDelDia(horario: VersionDelHorario, dia: string): string {
  const abierto = horario.dias.find((d) => d.dia === dia);
  if (!abierto) return 'Cerrado';
  const horas = `${enHora(abierto.apertura)} – ${enHora(abierto.cierre)}`;
  return abierto.noche === null
    ? horas
    : `${horas}, noche desde ${enHora(abierto.noche)}`;
}

/** Lo que cambió del horario y, si dejó reservas por jugar fuera, cuáles se respetan. */
export function detalleDelHorario({
  antes,
  despues,
  reservasFueraDeHorario = [],
}: Versiones<VersionDelHorario> & {
  reservasFueraDeHorario?: string[];
}): LineaDeDetalle[] {
  const fuera: LineaDeDetalle[] =
    reservasFueraDeHorario.length > 0
      ? [
          {
            campo: 'Reservas que quedaron fuera y se respetan',
            antes: null,
            despues: reservasFueraDeHorario.join(', '),
          },
        ]
      : [];
  return [...cambiosDelHorario(antes, despues), ...fuera];
}

function cambiosDelHorario(
  antes: VersionDelHorario | null,
  despues: VersionDelHorario,
): LineaDeDetalle[] {
  return lineasQueCambian<VersionDelHorario>(
    [
      ['Inicio de la noche', (h) => enHora(h.noche)],
      ...DIAS.map(
        ([dia, nombre]): [string, (h: VersionDelHorario) => string] => [
          nombre,
          (h) => textoDelDia(h, dia),
        ],
      ),
    ],
    antes,
    despues,
  );
}

function textoDeLaRegla(rangos: RangoDeLaRegla[]): string {
  return [...rangos]
    .sort((a, b) => b.desdeHoras - a.desdeHoras)
    .map(
      (r) =>
        `desde ${r.desdeHoras} h: ${r.porcentaje} %${r.ofreceCredito ? ' o crédito' : ''}`,
    )
    .join(' · ')
    .replace(/^d/, 'D');
}

export function detalleDeLaRegla({
  antes,
  despues,
}: Versiones<RangoDeLaRegla[]>): LineaDeDetalle[] {
  return lineasQueCambian([['Rangos', textoDeLaRegla]], antes, despues);
}

export function detalleDelAdelanto({
  antes,
  despues,
}: Versiones<VersionDelAdelanto>): LineaDeDetalle[] {
  return lineasQueCambian(
    [['Porcentaje del turno', (a) => `${a.porcentaje} %`]],
    antes,
    despues,
  );
}

export function detalleDelPlazo({
  antes,
  despues,
}: Versiones<VersionDelPlazo>): LineaDeDetalle[] {
  return lineasQueCambian(
    [['Minutos para pagar', (p) => `${p.minutos} min`]],
    antes,
    despues,
  );
}
