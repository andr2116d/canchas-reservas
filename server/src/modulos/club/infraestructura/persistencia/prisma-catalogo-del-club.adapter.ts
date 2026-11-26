import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type {
  AdicionalDelClub,
  CanchaDelClub,
  CatalogoDelClub,
} from '../../aplicacion/catalogo-del-club.port';

/** Lee las canchas operativas y los adicionales activos, sin datos de auditoría. */
@Injectable()
export class PrismaCatalogoDelClubAdapter implements CatalogoDelClub {
  constructor(private readonly prisma: PrismaService) {}

  canchasOperativas(): Promise<CanchaDelClub[]> {
    return this.prisma.cancha.findMany({
      where: { estado: 'OPERATIVA' },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        tieneIluminacion: true,
        caracteristicas: true,
        nota: true,
      },
    });
  }

  async adicionalesActivos(): Promise<AdicionalDelClub[]> {
    const filas = await this.prisma.adicional.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { nombre: 'asc' },
      select: { nombre: true, descripcion: true, precio: true },
    });
    return filas.map((fila) => ({ ...fila, precio: fila.precio.toFixed(2) }));
  }
}
