import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import { Sesion } from '../../dominio/sesion.entity';
import type {
  SesionConAcceso,
  SesionRepository,
} from '../../dominio/sesion.repository';

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

  async buscarPorTokenHash(
    tokenHash: string,
  ): Promise<SesionConAcceso | undefined> {
    const fila = await this.prisma.sesion.findUnique({
      where: { tokenHash },
      include: {
        usuario: {
          select: { rol: true, estado: true, requiereCambiarContrasena: true },
        },
      },
    });
    if (!fila) return undefined;
    return {
      sesion: Sesion.restaurar(fila),
      rol: fila.usuario.rol,
      activa: fila.usuario.estado === 'ACTIVO',
      requiereCambiarContrasena: fila.usuario.requiereCambiarContrasena,
    };
  }

  async actualizarActividad(sesion: Sesion): Promise<boolean> {
    const actualizadas = await this.prisma.$executeRaw`
      UPDATE sesion
      SET ultima_actividad_en = GREATEST(ultima_actividad_en, ${sesion.ultimaActividadEn})
      WHERE token_hash = ${sesion.tokenHash} AND expira_en > ${sesion.ultimaActividadEn}
        AND EXISTS (SELECT 1 FROM usuario WHERE id = sesion.usuario_id AND estado = 'activo')`;
    return actualizadas === 1;
  }

  async eliminar(tokenHash: string): Promise<void> {
    await this.prisma.sesion.deleteMany({ where: { tokenHash } });
  }
}
