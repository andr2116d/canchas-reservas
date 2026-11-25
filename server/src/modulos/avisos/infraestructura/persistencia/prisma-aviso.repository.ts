import { Injectable } from '@nestjs/common';
import type { RolUsuario } from '../../../../compartido/dominio/rol-usuario';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Aviso, AvisoNuevo, AvisoRepository } from '../../dominio/aviso';

/** Avisos en PostgreSQL. Un disparador de la base los anuncia en tiempo real al insertarlos. */
@Injectable()
export class PrismaAvisoRepository implements AvisoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearParaRol(rol: RolUsuario, aviso: AvisoNuevo): Promise<void> {
    const cuentas = await this.prisma.usuario.findMany({
      where: { rol, estado: 'ACTIVO' },
      select: { id: true },
    });
    await this.prisma.aviso.createMany({
      data: cuentas.map(({ id }) => ({ ...aviso, destinatarioId: id })),
    });
  }

  async crearPara(usuarioId: number, aviso: AvisoNuevo): Promise<void> {
    await this.prisma.aviso.create({
      data: { ...aviso, destinatarioId: usuarioId },
    });
  }

  recientes(usuarioId: number, limite: number): Promise<Aviso[]> {
    return this.prisma.aviso.findMany({
      where: { destinatarioId: usuarioId },
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
      take: limite,
      select: {
        id: true,
        tipo: true,
        referencia: true,
        creadoEn: true,
        leidoEn: true,
      },
    });
  }

  sinLeer(usuarioId: number): Promise<number> {
    return this.prisma.aviso.count({
      where: { destinatarioId: usuarioId, leidoEn: null },
    });
  }

  async marcarLeido(
    usuarioId: number,
    avisoId: number,
    momento: Date,
  ): Promise<boolean> {
    const propio = await this.prisma.aviso.count({
      where: { id: avisoId, destinatarioId: usuarioId },
    });
    await this.prisma.aviso.updateMany({
      where: { id: avisoId, destinatarioId: usuarioId, leidoEn: null },
      data: { leidoEn: momento },
    });
    return propio === 1;
  }

  async marcarTodosLeidos(usuarioId: number, momento: Date): Promise<void> {
    await this.prisma.aviso.updateMany({
      where: { destinatarioId: usuarioId, leidoEn: null },
      data: { leidoEn: momento },
    });
  }
}
