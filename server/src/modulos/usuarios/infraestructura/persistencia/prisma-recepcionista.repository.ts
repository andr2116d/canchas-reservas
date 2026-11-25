import {
  COLUMNAS_DEL_AUTOR,
  nombreDelAutor,
} from '../../../../compartido/infraestructura/cifrado/nombre-del-autor';
import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Correo } from '../../../../compartido/dominio/correo.value-object';
import {
  MENSAJES_DEL_PERSONAL,
  type DatoUnico,
} from '../../dominio/cuenta-ya-existe.error';
import type { DocumentoIdentidad } from '../../../../compartido/dominio/documento-identidad.value-object';
import type {
  AccionRegistrada,
  CambiosDeRecepcionista,
  CuentaCoincidente,
  FichaConHistorial,
  FichaDeRecepcionista,
  RecepcionistaRepository,
} from '../../dominio/recepcionista.repository';
import type { EstadoUsuario } from '../../../../compartido/dominio/rol-usuario';
import type { Usuario } from '../../dominio/usuario.entity';
import { aFicha } from './ficha-de-recepcionista.mapper';
import { rechazarDuplicado } from './rechazar-duplicado';
import {
  aColumnasPersonales,
  aFilaNueva,
  hashDeCorreo,
  hashDeDocumento,
} from './usuario.mapper';

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

  async listar(estado: EstadoUsuario): Promise<FichaDeRecepcionista[]> {
    const filas = await this.prisma.usuario.findMany({
      where: { rol: 'RECEPCIONISTA', estado },
    });
    return filas.map((fila) => aFicha(fila, this.cifrador));
  }

  async buscar(id: number): Promise<FichaConHistorial | undefined> {
    const fila = await this.prisma.usuario.findFirst({
      where: { id, rol: 'RECEPCIONISTA' },
      include: {
        accionesRecibidas: {
          orderBy: { ocurridoEn: 'desc' },
          include: {
            ejecutadoPor: { select: COLUMNAS_DEL_AUTOR },
          },
        },
      },
    });
    if (!fila) return undefined;
    const { accionesRecibidas, ...datos } = fila;
    return {
      ficha: aFicha(datos, this.cifrador),
      historial: accionesRecibidas.map(
        ({ accion, ocurridoEn, ejecutadoPor }) => ({
          accion,
          ocurridoEn,
          ejecutadoPor: nombreDelAutor(this.cifrador, ejecutadoPor),
        }),
      ),
    };
  }

  async actualizar(
    id: number,
    cambios: CambiosDeRecepcionista,
    { accion, ejecutadoPorId, ocurridoEn }: AccionRegistrada,
  ): Promise<boolean> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.usuario.updateMany({
          where: {
            id,
            rol: 'RECEPCIONISTA',
            ...(cambios.estadoEsperado && { estado: cambios.estadoEsperado }),
          },
          data: this.columnasCambiadas(cambios),
        });
        if (count === 0) return false;
        if (cambios.cerrarSesiones) {
          await tx.sesion.deleteMany({ where: { usuarioId: id } });
        }
        await tx.registroAuditoria.create({
          data: { accion, usuarioAfectadoId: id, ejecutadoPorId, ocurridoEn },
        });
        return true;
      });
    } catch (error) {
      rechazarDuplicado(error, MENSAJES_DEL_PERSONAL);
    }
  }

  private columnasCambiadas(cambios: CambiosDeRecepcionista) {
    return {
      ...(cambios.datos && aColumnasPersonales(cambios.datos, this.cifrador)),
      ...(cambios.estado && { estado: cambios.estado }),
      ...(cambios.contrasenaTemporal && {
        contrasenaHash: cambios.contrasenaTemporal.hash,
        contrasenaTemporalVenceEn: cambios.contrasenaTemporal.venceEn,
        requiereCambiarContrasena: true,
      }),
    };
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
