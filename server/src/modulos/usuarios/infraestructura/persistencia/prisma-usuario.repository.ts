import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { indiceUnicoViolado } from '../../../../compartido/infraestructura/prisma/indice-unico-violado';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Correo } from '../../dominio/correo.value-object';
import {
  CuentaYaExisteError,
  type DatoUnico,
} from '../../dominio/cuenta-ya-existe.error';
import type { DocumentoIdentidad } from '../../dominio/documento-identidad.value-object';
import type { Usuario } from '../../dominio/usuario.entity';
import type { UsuarioRepository } from '../../dominio/usuario.repository';
import { aFilaNueva, hashDeCorreo, hashDeDocumento } from './usuario.mapper';

// Índice único de la base que corresponde a cada dato que no puede repetirse.
const DATO_POR_INDICE: Record<string, DatoUnico> = {
  usuario_documento_hash_key: 'numeroDocumento',
  usuario_correo_hash_key: 'correo',
};

/** Repositorio de usuarios sobre PostgreSQL, con los datos personales cifrados. */
@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async existeConDocumento(documento: DocumentoIdentidad): Promise<boolean> {
    const total = await this.prisma.usuario.count({
      where: { documentoHash: hashDeDocumento(documento, this.cifrador) },
    });
    return total > 0;
  }

  async existeConCorreo(correo: Correo): Promise<boolean> {
    const total = await this.prisma.usuario.count({
      where: { correoHash: hashDeCorreo(correo, this.cifrador) },
    });
    return total > 0;
  }

  async crear(usuario: Usuario): Promise<number> {
    try {
      const fila = await this.prisma.usuario.create({
        data: aFilaNueva(usuario, this.cifrador),
        select: { id: true },
      });
      return fila.id;
    } catch (error) {
      // Otro registro con el mismo dato pudo guardarse entre la verificación y esta escritura.
      const dato = DATO_POR_INDICE[indiceUnicoViolado(error) ?? ''];
      if (dato) throw new CuentaYaExisteError([dato]);
      throw error;
    }
  }
}
