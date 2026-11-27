import { randomInt } from 'node:crypto';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import type { EstadoDeReserva } from '../../../src/generated/prisma/client';

const LETRAS_DEL_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface ReservaDePrueba {
  canchaId: number;
  /** Inicio con zona, como `2026-11-27T10:00:00-05:00`. */
  inicio: string;
  minutos?: number;
  estado?: EstadoDeReserva;
  titularId?: number;
  /** Solo para las pendientes de pago; si falta, retienen el turno hasta su inicio. */
  venceEn?: Date;
}

function unCodigoDePrueba(): string {
  return Array.from(
    { length: 6 },
    () => LETRAS_DEL_CODIGO[randomInt(LETRAS_DEL_CODIGO.length)],
  ).join('');
}

/** La regla de cancelación vigente; si nunca se guardó, guarda una que devuelve todo. */
export async function reglaDePrueba(
  prisma: PrismaService,
  autorId: number,
): Promise<number> {
  const vigente = await prisma.reglaDeCancelacion.findFirst({
    orderBy: { guardadaEn: 'desc' },
  });
  if (vigente) return vigente.id;
  const nueva = await prisma.reglaDeCancelacion.create({
    data: {
      guardadaPorId: autorId,
      rangos: {
        create: [{ desdeHoras: 0, porcentaje: 100, ofreceCredito: false }],
      },
    },
  });
  return nueva.id;
}

/**
 * Guarda una reserva directo en la base, para preparar el estado de una prueba sin
 * pasar por la API. Si no se indica el titular, usa el primer jugador registrado.
 */
export async function guardarReserva(
  prisma: PrismaService,
  {
    canchaId,
    inicio,
    minutos = 60,
    estado = 'CONFIRMADA',
    titularId,
    venceEn,
  }: ReservaDePrueba,
) {
  const titular =
    titularId ??
    (await prisma.usuario.findFirstOrThrow({ where: { rol: 'JUGADOR' } })).id;
  const desde = new Date(inicio);
  return prisma.reserva.create({
    data: {
      canchaId,
      titularId: titular,
      creadaPorId: titular,
      inicio: desde,
      fin: new Date(desde.getTime() + minutos * 60 * 1000),
      estado,
      codigo: unCodigoDePrueba(),
      precio: '60.00',
      porcentajeDeAdelanto: 50,
      adelanto: '30.00',
      reglaDeCancelacionId: await reglaDePrueba(prisma, titular),
      canal: 'WEB',
      venceEn: estado === 'PENDIENTE_DE_PAGO' ? (venceEn ?? desde) : null,
    },
  });
}
