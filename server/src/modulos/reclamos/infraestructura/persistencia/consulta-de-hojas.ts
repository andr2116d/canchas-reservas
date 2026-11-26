import type { Prisma } from '../../../../generated/prisma/client';
import type {
  EstadoDelFiltro,
  FiltroDeHojas,
} from '../../dominio/filtro-de-hojas';

type Donde = Prisma.HojaDeReclamacionWhereInput;

const POR_RESPONDER: Donde = { estado: { in: ['NUEVA', 'EN_ATENCION'] } };

/** Los filtros que no son el estado: también se aplican a los conteos de cada estado. */
export function dondeSinEstado(filtro: FiltroDeHojas): Donde {
  return {
    ...(filtro.tipo && { tipo: filtro.tipo }),
    ...(filtro.motivo && {
      motivo: filtro.motivo === 'SIN_MOTIVO' ? null : filtro.motivo,
    }),
    ...(filtro.numero && {
      anio: filtro.numero.anio,
      correlativo: filtro.numero.correlativo,
    }),
    ...((filtro.desde || filtro.antesDe) && {
      registradaEn: {
        ...(filtro.desde && { gte: filtro.desde }),
        ...(filtro.antesDe && { lt: filtro.antesDe }),
      },
    }),
  };
}

/** Las vencidas son las por responder con la fecha límite antes de hoy. */
export function dondeDelEstado(estado: EstadoDelFiltro, hoy: string): Donde {
  switch (estado) {
    case 'POR_RESPONDER':
      return POR_RESPONDER;
    case 'VENCIDAS':
      return {
        ...POR_RESPONDER,
        fechaLimite: { lt: new Date(`${hoy}T00:00:00.000Z`) },
      };
    case 'TODAS':
      return {};
    default:
      return { estado };
  }
}

/** «Vence primero»: las por responder por fecha límite y después las respondidas, la última primero. */
export function ordenDe(
  filtro: FiltroDeHojas,
): Prisma.HojaDeReclamacionOrderByWithRelationInput[] {
  if (filtro.orden === 'RECIENTES')
    return [{ registradaEn: 'desc' }, { id: 'desc' }];
  if (filtro.orden === 'ANTIGUAS')
    return [{ registradaEn: 'asc' }, { id: 'asc' }];
  return [
    { respondidaEn: { sort: 'desc', nulls: 'first' } },
    { fechaLimite: 'asc' },
    { id: 'asc' },
  ];
}

/** Cuántas hay en cada estado del filtro, a partir de los conteos por estado guardado. */
export function conteosPorEstado(
  porEstado: { estado: string; _count: { _all: number } }[],
  vencidas: number,
): Record<EstadoDelFiltro, number> {
  const de = (estado: string) =>
    porEstado.find((g) => g.estado === estado)?._count._all ?? 0;
  const nuevas = de('NUEVA');
  const enAtencion = de('EN_ATENCION');
  const respondidas = de('RESPONDIDA');
  return {
    POR_RESPONDER: nuevas + enAtencion,
    NUEVA: nuevas,
    EN_ATENCION: enAtencion,
    VENCIDAS: vencidas,
    RESPONDIDA: respondidas,
    TODAS: nuevas + enAtencion + respondidas,
  };
}
