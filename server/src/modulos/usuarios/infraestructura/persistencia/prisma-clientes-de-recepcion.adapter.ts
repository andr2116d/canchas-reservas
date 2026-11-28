import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import type { DocumentoIdentidad } from '../../../../compartido/dominio/documento-identidad.value-object';
import { indiceUnicoViolado } from '../../../../compartido/infraestructura/prisma/indice-unico-violado';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import type {
  AltaDeCliente,
  ClienteDeRecepcion,
  ClientesDeRecepcion,
} from '../../aplicacion/clientes-de-recepcion.use-case';
import type { Celular } from '../../dominio/celular.value-object';
import { rechazarDuplicado } from './rechazar-duplicado';
import {
  aColumnasPersonales,
  hashDeCelular,
  hashDeDocumento,
} from './usuario.mapper';

const CAMPOS = {
  id: true,
  nombresCifrado: true,
  apellidosCifrado: true,
  tipoDocumento: true,
  numeroDocumentoCifrado: true,
  celularCifrado: true,
} as const satisfies Prisma.UsuarioSelect;

type Fila = Prisma.UsuarioGetPayload<{ select: typeof CAMPOS }>;

@Injectable()
export class PrismaClientesDeRecepcionAdapter implements ClientesDeRecepcion {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async buscarPorDocumento(documento: DocumentoIdentidad) {
    const fila = await this.prisma.usuario.findUnique({
      where: {
        documentoHash_rol: {
          documentoHash: hashDeDocumento(documento, this.cifrador),
          rol: 'JUGADOR',
        },
      },
      select: CAMPOS,
    });
    return fila ? this.aCliente(fila) : undefined;
  }

  async buscarPorCelular(celular: Celular): Promise<ClienteDeRecepcion[]> {
    const filas = await this.prisma.usuario.findMany({
      where: {
        rol: 'JUGADOR',
        celularHash: hashDeCelular(celular, this.cifrador),
      },
      select: CAMPOS,
    });
    // Los números anteriores al índice solo se pueden comparar con la llave de la aplicación.
    const porLote = 200;
    for (let ultimoId = 0; ;) {
      const anteriores = await this.prisma.usuario.findMany({
        where: {
          rol: 'JUGADOR',
          celularHash: null,
          celularCifrado: { not: null },
          id: { gt: ultimoId },
        },
        orderBy: { id: 'asc' },
        take: porLote,
        select: CAMPOS,
      });
      for (const fila of anteriores) {
        if (
          fila.celularCifrado &&
          this.cifrador.descifrar(fila.celularCifrado) === celular.numero
        )
          filas.push(fila);
      }
      if (anteriores.length < porLote) break;
      ultimoId = anteriores[anteriores.length - 1].id;
    }
    return filas.sort((a, b) => a.id - b.id).map((fila) => this.aCliente(fila));
  }

  async guardar({
    numeroDocumento,
    versionDelAviso,
    informadoEn,
    informadoPorId,
    ...datos
  }: AltaDeCliente) {
    const existente = await this.buscarPorDocumento(numeroDocumento);
    if (existente) return { cliente: existente, existente: true };
    try {
      const fila = await this.prisma.usuario.create({
        data: {
          ...aColumnasPersonales(
            { ...datos, documento: numeroDocumento },
            this.cifrador,
          ),
          rol: 'JUGADOR',
          estado: 'ACTIVO',
          versionLegalAceptada: versionDelAviso,
          aceptacionLegalEn: informadoEn,
          canalAceptacionLegal: 'recepcion',
          avisoDePrivacidadInformadoPorId: informadoPorId,
        },
        select: CAMPOS,
      });
      return { cliente: this.aCliente(fila), existente: false };
    } catch (error) {
      const indice = indiceUnicoViolado(error);
      if (indice === 'usuario_documento_hash_rol_key' || indice === 'usuario_correo_hash_key') {
        const cliente = await this.buscarPorDocumento(numeroDocumento);
        if (cliente) return { cliente, existente: true };
      }
      return rechazarDuplicado(error);
    }
  }

  private aCliente(fila: Fila): ClienteDeRecepcion {
    const descifrar = (dato: string) => this.cifrador.descifrar(dato);
    return {
      id: fila.id,
      nombre: `${descifrar(fila.nombresCifrado)} ${descifrar(fila.apellidosCifrado)}`,
      tipoDocumento: fila.tipoDocumento ?? '',
      numeroDocumento: fila.numeroDocumentoCifrado
        ? descifrar(fila.numeroDocumentoCifrado)
        : '',
    };
  }
}
