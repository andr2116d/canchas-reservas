import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import { Sesion } from '../../dominio/sesion.entity';
import type { SesionRepository } from '../../dominio/sesion.repository';

/** Repositorio de sesiones sobre PostgreSQL. */
@Injectable()
export class PrismaSesionRepository implements SesionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(sesion: Sesion): Promise<void> {
    await this.prisma.sesion.create({
      data: {
        usuarioId: sesion.usuarioId,
        tokenHash: sesion.tokenHash,
        ultimaActividadEn: sesion.ultimaActividadEn,
        expiraEn: sesion.expiraEn,
      },
    });
  }

  async buscarPorTokenHash(tokenHash: string): Promise<Sesion | undefined> {
    const fila = await this.prisma.sesion.findUnique({ where: { tokenHash } });
    return fila ? Sesion.restaurar(fila) : undefined;
  }

  async actualizarActividad(sesion: Sesion): Promise<void> {
    await this.prisma.sesion.update({
      where: { tokenHash: sesion.tokenHash },
      data: { ultimaActividadEn: sesion.ultimaActividadEn },
    });
  }
}
