import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { quitarCamposSensibles } from './detalle-cambios';

export interface RegistroAuditoria {
  usuarioId?: number | null;
  accion: string;
  entidad: string;
  entidadId?: number | null;
  motivo?: string | null;
  detalle?: Prisma.InputJsonValue | null;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  registrar(datos: RegistroAuditoria, tx?: Prisma.TransactionClient) {
    const cliente = tx ?? this.prisma;
    return cliente.auditoria.create({
      data: {
        usuarioId: datos.usuarioId ?? null,
        accion: datos.accion,
        entidad: datos.entidad,
        entidadId: datos.entidadId ?? null,
        motivo: datos.motivo ?? null,
        detalle: datos.detalle
          ? (quitarCamposSensibles(datos.detalle) as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }
}
