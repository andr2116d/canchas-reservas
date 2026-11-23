import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Correo } from '../../dominio/correo.value-object';
import {
  MENSAJES_DEL_PERSONAL,
  type DatoUnico,
} from '../../dominio/cuenta-ya-existe.error';
import type { DocumentoIdentidad } from '../../dominio/documento-identidad.value-object';
import type {
  AccionRegistrada,
  CuentaCoincidente,
  RecepcionistaRepository,
} from '../../dominio/recepcionista.repository';
import type { Usuario } from '../../dominio/usuario.entity';
import { rechazarDuplicado } from './rechazar-duplicado';
import { aFilaNueva, hashDeCorreo, hashDeDocumento } from './usuario.mapper';

/** Cuentas de recepción sobre PostgreSQL; cada cambio queda en la auditoría. */
@Injectable()
export class PrismaRecepcionistaRepository implements RecepcionistaRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async buscarCoincidencias(
    documento: DocumentoIdentidad,
    correo: Correo,
  ): Promise<CuentaCoincidente[]> {
    const documentoHash = hashDeDocumento(documento, this.cifrador);
    const correoHash = hashDeCorreo(correo, this.cifrador);
    const filas = await this.prisma.usuario.findMany({
      where: {
        OR: [{ documentoHash, rol: 'RECEPCIONISTA' }, { correoHash }],
      },
      select: {
        id: true,
        nombresCifrado: true,
        rol: true,
        estado: true,
        documentoHash: true,
        correoHash: true,
      },
    });
    return filas.map((fila) => ({
      id: fila.id,
      nombres: this.cifrador.descifrar(fila.nombresCifrado),
      rol: fila.rol,
      estado: fila.estado,
      coincideEn: [
        fila.rol === 'RECEPCIONISTA' &&
          fila.documentoHash === documentoHash &&
          'numeroDocumento',
        fila.correoHash === correoHash && 'correo',
      ].filter((dato): dato is DatoUnico => dato !== false),
    }));
  }

  async crear(
    recepcionista: Usuario,
    { accion, ejecutadoPorId, ocurridoEn }: AccionRegistrada,
  ): Promise<number> {
    try {
      const fila = await this.prisma.usuario.create({
        data: {
          ...aFilaNueva(recepcionista, this.cifrador),
          accionesRecibidas: {
            create: { accion, ejecutadoPorId, ocurridoEn },
          },
        },
        select: { id: true },
      });
      return fila.id;
    } catch (error) {
      rechazarDuplicado(error, MENSAJES_DEL_PERSONAL);
    }
  }
}
