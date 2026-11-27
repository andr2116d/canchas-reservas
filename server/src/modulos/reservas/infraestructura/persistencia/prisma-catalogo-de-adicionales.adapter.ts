import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type {
  AdicionalOfrecido,
  CatalogoDeAdicionales,
} from '../../aplicacion/catalogo-de-adicionales.port';

/** El material activo del local, como se ofrece al reservar. */
@Injectable()
export class PrismaCatalogoDeAdicionalesAdapter implements CatalogoDeAdicionales {
  constructor(private readonly prisma: PrismaService) {}

  async activos(): Promise<AdicionalOfrecido[]> {
    const filas = await this.prisma.adicional.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true, descripcion: true, precio: true },
    });
    return filas.map((fila) => ({ ...fila, precio: fila.precio.toFixed(2) }));
  }
}
