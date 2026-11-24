import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { LimiteExcedidoError } from '../../../../compartido/dominio/dominio.error';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import type { LimiteVigente } from '../../dominio/limites-de-cambios';
import type { RolUsuario } from '../../../../compartido/dominio/rol-usuario';
import type { Correo } from '../../dominio/correo.value-object';
import type { DocumentoIdentidad } from '../../dominio/documento-identidad.value-object';
import type { Usuario } from '../../dominio/usuario.entity';
import type { AccionAuditada } from '../../dominio/accion-auditada';
import type {
  CambioPropio,
  DatosDelAlta,
  DatosPropios,
  UsuarioRepository,
} from '../../dominio/usuario.repository';
import {
  aEntidad,
  aFilaNueva,
  hashDeCorreo,
  hashDeDocumento,
} from './usuario.mapper';
import { rechazarDuplicado } from './rechazar-duplicado';

/** Repositorio de usuarios sobre PostgreSQL, con los datos personales cifrados. */
@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async existeConDocumento(
    documento: DocumentoIdentidad,
    rol: RolUsuario,
  ): Promise<boolean> {
    const total = await this.prisma.usuario.count({
      where: { documentoHash: hashDeDocumento(documento, this.cifrador), rol },
    });
    return total > 0;
  }

  async existeConCorreo(correo: Correo): Promise<boolean> {
    const total = await this.prisma.usuario.count({
      where: { correoHash: hashDeCorreo(correo, this.cifrador) },
    });
    return total > 0;
  }

  async buscarPorId(id: number): Promise<Usuario | undefined> {
    const fila = await this.prisma.usuario.findUnique({ where: { id } });
    return fila ? aEntidad(fila, this.cifrador) : undefined;
  }

  async crear(
    usuario: Usuario,
    { sesion, aceptacion }: DatosDelAlta,
  ): Promise<number> {
    try {
      const fila = await this.prisma.usuario.create({
        data: {
          ...aFilaNueva(usuario, this.cifrador),
          versionLegalAceptada: aceptacion.version,
          aceptacionLegalEn: aceptacion.fecha,
          canalAceptacionLegal: aceptacion.canal,
          sesiones: { create: sesion },
          accesos: { create: { ocurridoEn: sesion.ultimaActividadEn } },
        },
        select: { id: true },
      });
      return fila.id;
    } catch (error) {
      // Otro registro con el mismo dato pudo guardarse entre la verificación y esta escritura.
      rechazarDuplicado(error);
    }
  }

  async aplicarCambioPropio(cambio: CambioPropio): Promise<boolean> {
    const { usuarioId, marca } = cambio;
    try {
      return await this.prisma.$transaction(async (base) => {
        await exigirLimitesAlEscribir(base, usuarioId, cambio.limites);
        const { count } = await base.usuario.updateMany({
          where: {
            id: usuarioId,
            ...(marca === 'DATOS_CONFIRMADOS' && { datosConfirmadosEn: null }),
            ...(marca === 'DOCUMENTO_CAMBIADO' && {
              documentoCambiadoEn: null,
            }),
          },
          data: {
            ...columnasPropias(cambio.datos, this.cifrador),
            ...(marca === 'DATOS_CONFIRMADOS' && {
              datosConfirmadosEn: cambio.ocurridoEn,
            }),
            ...(marca === 'DOCUMENTO_CAMBIADO' && {
              documentoCambiadoEn: cambio.ocurridoEn,
            }),
          },
        });
        if (count === 0) return false;
        await base.registroAuditoria.create({
          data: {
            accion: cambio.accion,
            usuarioAfectadoId: usuarioId,
            ejecutadoPorId: usuarioId,
            ocurridoEn: cambio.ocurridoEn,
          },
        });
        if (cambio.conservarSesion)
          await base.sesion.deleteMany({
            where: { usuarioId, tokenHash: { not: cambio.conservarSesion } },
          });
        return true;
      });
    } catch (error) {
      rechazarDuplicado(error);
    }
  }

  contarAccionesPropias(
    usuarioId: number,
    acciones: AccionAuditada[],
    desde: Date,
  ): Promise<number> {
    return this.prisma.registroAuditoria.count({
      where: accionesPropias(usuarioId, acciones, desde),
    });
  }

  async crearPersonal(usuario: Usuario): Promise<void> {
    try {
      await this.prisma.usuario.create({
        data: aFilaNueva(usuario, this.cifrador),
        select: { id: true },
      });
    } catch (error) {
      rechazarDuplicado(error);
    }
  }
}

/** Lo que la persona hizo sobre su propia cuenta desde un momento. */
function accionesPropias(
  usuarioId: number,
  acciones: AccionAuditada[],
  desde: Date,
): Prisma.RegistroAuditoriaWhereInput {
  return {
    usuarioAfectadoId: usuarioId,
    ejecutadoPorId: usuarioId,
    accion: { in: acciones },
    ocurridoEn: { gte: desde },
  };
}

/**
 * Bloquea la fila de la cuenta hasta el final de la transacción y vuelve a contar:
 * así dos cambios simultáneos no ven el mismo conteo y superan el límite.
 */
async function exigirLimitesAlEscribir(
  base: Prisma.TransactionClient,
  usuarioId: number,
  limites: LimiteVigente[] = [],
): Promise<void> {
  if (limites.length === 0) return;
  await base.$queryRaw`SELECT id FROM usuario WHERE id = ${usuarioId} FOR UPDATE`;
  for (const { acciones, desde, maximo, mensaje } of limites) {
    const hechos = await base.registroAuditoria.count({
      where: accionesPropias(usuarioId, acciones, desde),
    });
    if (hechos >= maximo) throw new LimiteExcedidoError(mensaje);
  }
}

/** Solo las columnas de los datos que cambian, cada dato personal cifrado. */
function columnasPropias(datos: DatosPropios, cifrador: Cifrador) {
  const cifrar = (texto: string) => cifrador.cifrar(texto);
  return {
    ...(datos.nombres && { nombresCifrado: cifrar(datos.nombres.texto) }),
    ...(datos.apellidos && { apellidosCifrado: cifrar(datos.apellidos.texto) }),
    ...(datos.fechaNacimiento && {
      fechaNacimientoCifrada: cifrar(datos.fechaNacimiento.fecha),
    }),
    ...(datos.documento && {
      tipoDocumento: datos.documento.tipo,
      numeroDocumentoCifrado: cifrar(datos.documento.numero),
      documentoHash: hashDeDocumento(datos.documento, cifrador),
    }),
    ...(datos.correo && {
      correoCifrado: cifrar(datos.correo.direccion),
      correoHash: hashDeCorreo(datos.correo, cifrador),
    }),
    ...(datos.celular && { celularCifrado: cifrar(datos.celular.numero) }),
    ...(datos.dorsal !== undefined && { dorsal: datos.dorsal?.numero ?? null }),
  };
}
