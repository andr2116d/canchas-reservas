import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { RolUsuario } from '../../../../compartido/dominio/rol-usuario';
import type { Correo } from '../../dominio/correo.value-object';
import type { DocumentoIdentidad } from '../../dominio/documento-identidad.value-object';
import type { Usuario } from '../../dominio/usuario.entity';
import type {
  DatosDelAlta,
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
