import type { PrismaService } from '../../prisma/prisma.service';
import type { Nombres } from './traducir-detalle';

export interface FilaConReferencia {
  entidad: string;
  entidadId: number | null;
  detalle: unknown;
}

type Objeto = Record<string, unknown>;

const FRANJAS: Record<string, string> = { DIA: 'Día', NOCHE: 'Noche' };
const FIJAS: Record<string, string> = {
  HORARIO: 'Horario',
  REGLA_CANCELACION: 'Regla de cancelación',
};

const objeto = (valor: unknown): Objeto =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Objeto)
    : {};

const esId = (valor: unknown): valor is number =>
  typeof valor === 'number' && Number.isInteger(valor) && valor > 0;

function nombreEnDetalle(detalle: unknown, campo: string) {
  const { anterior, nuevo } = objeto(detalle);
  const valor = objeto(nuevo)[campo] ?? objeto(anterior)[campo];
  return typeof valor === 'string' ? valor : undefined;
}

function idsPorTabla(filas: FilaConReferencia[]) {
  const ids = {
    cancha: new Set<number>(),
    reserva: new Set<number>(),
    usuario: new Set<number>(),
    adicional: new Set<number>(),
  };
  const agregar = (tabla: keyof typeof ids, valor: unknown) => {
    if (esId(valor)) ids[tabla].add(valor);
  };

  for (const { entidad, entidadId, detalle } of filas) {
    const datos = objeto(detalle);
    if (entidad === 'CANCHA') agregar('cancha', entidadId);
    if (entidad === 'TARIFA') agregar('cancha', datos.canchaId);
    if (entidad === 'RESERVA') {
      agregar('reserva', entidadId);
      agregar('cancha', datos.canchaId);
    }
    if (entidad === 'HORARIO' && Array.isArray(datos.reservasFueraDeHorario)) {
      for (const id of datos.reservasFueraDeHorario) agregar('reserva', id);
    }
    if (entidad === 'RECEPCIONISTA') agregar('usuario', entidadId);
    if (entidad === 'ADICIONAL') agregar('adicional', entidadId);
  }
  return ids;
}

const enLista = (ids: Set<number>) => ({ id: { in: [...ids] } });

export async function cargarReferencias(
  prisma: PrismaService,
  filas: FilaConReferencia[],
) {
  const ids = idsPorTabla(filas);
  const [canchas, reservas, usuarios, adicionales] = await Promise.all([
    ids.cancha.size
      ? prisma.cancha.findMany({
          where: enLista(ids.cancha),
          select: { id: true, nombre: true },
        })
      : [],
    ids.reserva.size
      ? prisma.reserva.findMany({
          where: enLista(ids.reserva),
          select: { id: true, codigo: true },
        })
      : [],
    ids.usuario.size
      ? prisma.usuario.findMany({
          where: enLista(ids.usuario),
          select: { id: true, nombres: true, apellidos: true },
        })
      : [],
    ids.adicional.size
      ? prisma.adicional.findMany({
          where: enLista(ids.adicional),
          select: { id: true, nombre: true },
        })
      : [],
  ]);

  const nombreCancha = new Map(canchas.map((c) => [c.id, c.nombre]));
  const codigoReserva = new Map(reservas.map((r) => [r.id, r.codigo]));
  const nombreUsuario = new Map(
    usuarios.map((u) => [
      u.id,
      [u.nombres, u.apellidos]
        .map((parte) => parte?.trim())
        .filter(Boolean)
        .join(' '),
    ]),
  );
  const nombreAdicional = new Map(adicionales.map((a) => [a.id, a.nombre]));

  const nombres: Nombres = {
    cancha: (id) => nombreCancha.get(id) ?? `Cancha #${id}`,
    reserva: (id) => codigoReserva.get(id) ?? `Reserva #${id}`,
  };

  const referencia = ({
    entidad,
    entidadId,
    detalle,
  }: FilaConReferencia): string | null => {
    if (FIJAS[entidad]) return FIJAS[entidad];
    const datos = objeto(detalle);
    const id = esId(entidadId) ? entidadId : undefined;
    const de = (mapa: Map<number, string>) => (id ? mapa.get(id) : undefined);

    switch (entidad) {
      case 'CANCHA':
        return (
          de(nombreCancha) ??
          nombreEnDetalle(detalle, 'nombre') ??
          (id ? `Cancha #${id}` : null)
        );
      case 'TARIFA': {
        const cancha = esId(datos.canchaId)
          ? nombres.cancha(datos.canchaId)
          : id
            ? `Tarifa #${id}`
            : 'Tarifa';
        const franja = FRANJAS[String(datos.franja)];
        return franja ? `${cancha} · ${franja}` : cancha;
      }
      case 'RESERVA':
        return (
          de(codigoReserva) ??
          (typeof datos.codigo === 'string' ? datos.codigo : undefined) ??
          (id ? `Reserva #${id}` : null)
        );
      case 'RECEPCIONISTA': {
        return (
          de(nombreUsuario) ??
          nombreEnDetalle(detalle, 'nombres') ??
          (id ? `Recepcionista #${id}` : null)
        );
      }
      case 'ADICIONAL':
        return (
          de(nombreAdicional) ??
          nombreEnDetalle(detalle, 'nombre') ??
          (id ? `Adicional #${id}` : null)
        );
      default:
        return id ? `#${id}` : null;
    }
  };

  return { nombres, referencia };
}
