import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import type { EstadoDeReserva } from '../../../src/generated/prisma/client';

interface ReservaDePrueba {
  canchaId: number;
  /** Inicio con zona, como `2026-11-27T10:00:00-05:00`. */
  inicio: string;
  minutos?: number;
  estado?: EstadoDeReserva;
  titularId?: number;
}

/**
 * Guarda una reserva directo en la base, porque todavía no hay forma de crearla
 * por la API. Si no se indica el titular, usa el primer jugador registrado.
 */
export async function guardarReserva(
  prisma: PrismaService,
  {
    canchaId,
    inicio,
    minutos = 60,
    estado = 'CONFIRMADA',
    titularId,
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
      inicio: desde,
      fin: new Date(desde.getTime() + minutos * 60 * 1000),
      estado,
    },
  });
}
