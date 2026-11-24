import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { ConflictoError } from '../../../../compartido/dominio/dominio.error';
import { indiceUnicoViolado } from '../../../../compartido/infraestructura/prisma/indice-unico-violado';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { type CambiosDeCancha, Cancha } from '../../dominio/cancha.entity';
import type {
  Autoria,
  CambioAuditado,
  CambioRegistrado,
  CanchaRepository,
} from '../../dominio/cancha.repository';

type FilaDeCancha = Prisma.CanchaGetPayload<object>;

const CON_AUTOR = {
  ejecutadoPor: { select: { nombresCifrado: true, apellidosCifrado: true } },
} as const satisfies Prisma.CambioDeCanchaInclude;

function aCancha(fila: FilaDeCancha): Cancha {
  const { id, nombre, tipo, tieneIluminacion, caracteristicas, nota, estado } =
    fila;
  return Cancha.restaurar(id, {
    nombre,
    tipo,
    tieneIluminacion,
    caracteristicas,
    nota,
    estado,
  });
}

function aFila(cancha: Cancha) {
  return { ...cancha.ficha, nombreNormalizado: cancha.nombreNormalizado };
}

/** Otra cancha pudo tomar el nombre entre la verificación y la escritura. */
function rechazarNombreRepetido(error: unknown): never {
  if (indiceUnicoViolado(error) === 'cancha_nombre_normalizado_key')
    throw new ConflictoError('El nombre ya lo usa otra cancha.', {
      nombre: 'Ya existe una cancha con este nombre.',
    });
  throw error;
}

/** Canchas sobre PostgreSQL; cada escritura deja su cambio en la auditoría en la misma transacción. */
@Injectable()
export class PrismaCanchaRepository implements CanchaRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async listar(): Promise<Cancha[]> {
    const filas = await this.prisma.cancha.findMany({ orderBy: { id: 'asc' } });
    return filas.map(aCancha);
  }

  async buscar(id: number): Promise<Cancha | undefined> {
    const fila = await this.prisma.cancha.findUnique({ where: { id } });
    return fila ? aCancha(fila) : undefined;
  }

  async nombresOcupados(
    normalizados: string[],
    exceptoId?: number,
  ): Promise<string[]> {
    const filas = await this.prisma.cancha.findMany({
      where: {
        nombreNormalizado: { in: normalizados },
        ...(exceptoId !== undefined && { id: { not: exceptoId } }),
      },
      select: { nombreNormalizado: true },
    });
    return filas.map((fila) => fila.nombreNormalizado);
  }

  registrar(canchas: Cancha[], autoria: Autoria): Promise<Cancha[]> {
    return this.prisma
      .$transaction((tx) =>
        Promise.all(
          canchas.map((cancha) =>
            tx.cancha.create({
              data: {
                ...aFila(cancha),
                cambios: {
                  create: this.cambio(cancha, { ...autoria, accion: 'ALTA' }),
                },
              },
            }),
          ),
        ),
      )
      .then((filas) => filas.sort((a, b) => a.id - b.id).map(aCancha))
      .catch(rechazarNombreRepetido);
  }

  async guardar(cancha: Cancha, cambio: CambioAuditado): Promise<void> {
    await this.prisma.cancha
      .update({
        where: { id: cancha.id },
        data: {
          ...aFila(cancha),
          cambios: { create: this.cambio(cancha, cambio) },
        },
      })
      .catch(rechazarNombreRepetido);
  }

  async eliminar(cancha: Cancha, autoria: Autoria): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cambioDeCancha.create({
        data: this.cambio(cancha, { ...autoria, accion: 'ELIMINACION' }),
      }),
      this.prisma.cancha.delete({ where: { id: cancha.id } }),
    ]);
  }

  async cambios(limite: number): Promise<CambioRegistrado[]> {
    const filas = await this.prisma.cambioDeCancha.findMany({
      orderBy: [{ ocurridoEn: 'desc' }, { id: 'desc' }],
      take: limite,
      include: CON_AUTOR,
    });
    return filas.map((fila) => ({
      accion: fila.accion,
      nombreDeLaCancha: fila.nombreDeLaCancha,
      ejecutadoPor: [
        fila.ejecutadoPor.nombresCifrado,
        fila.ejecutadoPor.apellidosCifrado,
      ]
        .map((valor) => this.cifrador.descifrar(valor))
        .join(' '),
      ocurridoEn: fila.ocurridoEn,
      detalle: fila.detalle as CambiosDeCancha | null,
    }));
  }

  private cambio(cancha: Cancha, cambio: CambioAuditado) {
    return {
      accion: cambio.accion,
      nombreDeLaCancha: cancha.ficha.nombre,
      ejecutadoPorId: cambio.ejecutadoPorId,
      ocurridoEn: cambio.ocurridoEn,
      ...(cambio.detalle && {
        detalle: cambio.detalle as Prisma.InputJsonObject,
      }),
    };
  }
}
