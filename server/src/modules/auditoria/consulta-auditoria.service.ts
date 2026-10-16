import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConsultarAuditoriaDto } from './dto/consultar-auditoria.dto';
import { cargarReferencias } from './referencias-auditoria';
import { aUsuario, CAMPOS_USUARIO, pagina, rangoDeFechas } from './paginacion';
import { traducirDetalle } from './traducir-detalle';

@Injectable()
export class ConsultaAuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: ConsultarAuditoriaDto) {
    const where: Prisma.AuditoriaWhereInput = {
      entidad: filtros.entidad,
      accion: filtros.accion,
      usuarioId: filtros.usuarioId,
      fecha: rangoDeFechas(filtros),
    };
    const [total, filas] = await Promise.all([
      this.prisma.auditoria.count({ where }),
      this.prisma.auditoria.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        ...pagina(filtros),
        include: { usuario: { select: CAMPOS_USUARIO } },
      }),
    ]);

    const { nombres, referencia } = await cargarReferencias(this.prisma, filas);

    return {
      items: filas.map((fila) => ({
        id: fila.id,
        fecha: fila.fecha,
        usuario: aUsuario(fila.usuario),
        accion: fila.accion,
        entidad: fila.entidad,
        entidadId: fila.entidadId,
        referencia: referencia(fila),
        motivo: fila.motivo,
        cambios: traducirDetalle(fila.entidad, fila.detalle, nombres),
      })),
      total,
      pagina: filtros.pagina,
      tamano: filtros.tamano,
    };
  }
}
