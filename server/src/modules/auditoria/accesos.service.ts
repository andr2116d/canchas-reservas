import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConsultarAccesosDto } from './dto/consultar-accesos.dto';
import { aUsuario, CAMPOS_USUARIO, pagina, rangoDeFechas } from './paginacion';

const escaparComodines = (texto: string) => texto.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class AccesosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: ConsultarAccesosDto) {
    const where: Prisma.RegistroAccesoWhereInput = {
      exito: filtros.exito,
      correo: filtros.correo
        ? { contains: escaparComodines(filtros.correo), mode: 'insensitive' }
        : undefined,
      fecha: rangoDeFechas(filtros),
    };
    const [total, filas] = await Promise.all([
      this.prisma.registroAcceso.count({ where }),
      this.prisma.registroAcceso.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        ...pagina(filtros),
        include: { usuario: { select: CAMPOS_USUARIO } },
      }),
    ]);

    return {
      items: filas.map((fila) => ({
        id: fila.id,
        fecha: fila.fecha,
        correo: fila.correo,
        usuario: aUsuario(fila.usuario),
        exito: fila.exito,
        motivo: fila.motivo,
        ip: fila.ip,
      })),
      total,
      pagina: filtros.pagina,
      tamano: filtros.tamano,
    };
  }
}
