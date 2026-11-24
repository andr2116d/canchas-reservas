import { debeCompletarDatos } from '../../../../compartido/dominio/datos-del-personal';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import { Sesion } from '../../dominio/sesion.entity';
import type {
  SesionConAcceso,
  SesionDeLaCuenta,
  SesionRepository,
} from '../../dominio/sesion.repository';

/** Repositorio de sesiones sobre PostgreSQL. */
@Injectable()
export class PrismaSesionRepository implements SesionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deUsuario(usuarioId: number): Promise<SesionDeLaCuenta[]> {
    const filas = await this.prisma.sesion.findMany({
      where: { usuarioId },
      orderBy: { ultimaActividadEn: 'desc' },
    });
    return filas.map((fila) => {
      const dispositivo = fila.dispositivo ?? undefined;
      return {
        id: fila.id,
        tokenHash: fila.tokenHash,
        dispositivo,
        abiertaEn: fila.creadaEn,
        sesion: Sesion.restaurar({ ...fila, dispositivo }),
      };
    });
  }

  async cerrarOtras(usuarioId: number, tokenHashActual: string): Promise<void> {
    await this.prisma.sesion.deleteMany({
      where: { usuarioId, tokenHash: { not: tokenHashActual } },
    });
  }

  async guardar(sesion: Sesion): Promise<void> {
    await this.prisma.sesion.create({
      data: {
        usuarioId: sesion.usuarioId,
        tokenHash: sesion.tokenHash,
        ultimaActividadEn: sesion.ultimaActividadEn,
        expiraEn: sesion.expiraEn,
        dispositivo: sesion.dispositivo,
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
          select: {
            rol: true,
            estado: true,
            requiereCambiarContrasena: true,
            contrasenaTemporalVenceEn: true,
            datosConfirmadosEn: true,
          },
        },
      },
    });
    if (!fila) return undefined;
    return {
      sesion: Sesion.restaurar({
        ...fila,
        dispositivo: fila.dispositivo ?? undefined,
      }),
      rol: fila.usuario.rol,
      activa: fila.usuario.estado === 'ACTIVO',
      requiereCambiarContrasena: fila.usuario.requiereCambiarContrasena,
      cambioOmitido: fila.cambioOmitido,
      requiereCompletarDatos: debeCompletarDatos(
        fila.usuario.rol,
        fila.usuario.datosConfirmadosEn,
      ),
      contrasenaTemporalVenceEn:
        fila.usuario.contrasenaTemporalVenceEn ?? undefined,
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

  async omitirCambio(tokenHash: string): Promise<void> {
    await this.prisma.sesion.updateMany({
      where: { tokenHash },
      data: { cambioOmitido: true },
    });
  }

  async eliminar(tokenHash: string): Promise<void> {
    await this.prisma.sesion.deleteMany({ where: { tokenHash } });
  }
}
