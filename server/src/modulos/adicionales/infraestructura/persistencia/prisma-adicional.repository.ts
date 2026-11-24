import {
  COLUMNAS_DEL_AUTOR,
  nombreDelAutor,
} from '../../../../compartido/infraestructura/cifrado/nombre-del-autor';
import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { Monto } from '../../../../compartido/dominio/monto.value-object';
import { indiceUnicoViolado } from '../../../../compartido/infraestructura/prisma/indice-unico-violado';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { Adicional } from '../../dominio/adicional.entity';
import type {
  AdicionalRepository,
  Autoria,
  CambioAuditado,
  CambioRegistrado,
} from '../../dominio/adicional.repository';
import { nombreRepetido } from '../../aplicacion/comprobaciones-de-adicional';

type FilaDeAdicional = Prisma.AdicionalGetPayload<object>;

const CON_AUTOR = {
  ejecutadoPor: { select: COLUMNAS_DEL_AUTOR },
} as const satisfies Prisma.CambioDeAdicionalInclude;

function aAdicional(fila: FilaDeAdicional): Adicional {
  return Adicional.restaurar(fila.id, {
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precio: Monto.desdeCentimos(fila.precio.mul(100).toNumber()),
    estado: fila.estado,
  });
}

function aFila(adicional: Adicional) {
  const { nombre, descripcion, precio } = adicional.resumen;
  return {
    nombre,
    descripcion,
    precio,
    estado: adicional.ficha.estado,
    nombreNormalizado: adicional.nombreNormalizado,
  };
}

/** Otro adicional pudo tomar el nombre entre la verificación y la escritura. */
function rechazarNombreRepetido(adicional: Adicional) {
  return (error: unknown): never => {
    if (indiceUnicoViolado(error) === 'adicional_nombre_normalizado_key')
      throw nombreRepetido(adicional.resumen.nombre);
    throw error;
  };
}

/** Adicionales sobre PostgreSQL; cada escritura deja su cambio en la auditoría en la misma transacción. */
@Injectable()
export class PrismaAdicionalRepository implements AdicionalRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async listar(): Promise<Adicional[]> {
    const filas = await this.prisma.adicional.findMany({
      orderBy: { id: 'asc' },
    });
    return filas.map(aAdicional);
  }

  async buscar(id: number): Promise<Adicional | undefined> {
    const fila = await this.prisma.adicional.findUnique({ where: { id } });
    return fila ? aAdicional(fila) : undefined;
  }

  async nombreOcupado(
    normalizado: string,
    exceptoId?: number,
  ): Promise<boolean> {
    const otro = await this.prisma.adicional.findFirst({
      where: {
        nombreNormalizado: normalizado,
        ...(exceptoId !== undefined && { id: { not: exceptoId } }),
      },
      select: { id: true },
    });
    return otro !== null;
  }

  async registrar(adicional: Adicional, autoria: Autoria): Promise<Adicional> {
    const fila = await this.prisma.adicional
      .create({
        data: {
          ...aFila(adicional),
          cambios: {
            create: this.cambio(adicional, {
              ...autoria,
              accion: 'ALTA',
              detalle: adicional.resumen,
            }),
          },
        },
      })
      .catch(rechazarNombreRepetido(adicional));
    return aAdicional(fila);
  }

  async guardar(adicional: Adicional, cambio: CambioAuditado): Promise<void> {
    await this.prisma.adicional
      .update({
        where: { id: adicional.id },
        data: {
          ...aFila(adicional),
          cambios: { create: this.cambio(adicional, cambio) },
        },
      })
      .catch(rechazarNombreRepetido(adicional));
  }

  async eliminar(adicional: Adicional, autoria: Autoria): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cambioDeAdicional.create({
        data: this.cambio(adicional, { ...autoria, accion: 'ELIMINACION' }),
      }),
      this.prisma.adicional.delete({ where: { id: adicional.id } }),
    ]);
  }

  async cambios(limite: number): Promise<CambioRegistrado[]> {
    const filas = await this.prisma.cambioDeAdicional.findMany({
      orderBy: [{ ocurridoEn: 'desc' }, { id: 'desc' }],
      take: limite,
      include: CON_AUTOR,
    });
    return filas.map((fila) => ({
      accion: fila.accion,
      nombreDelAdicional: fila.nombreDelAdicional,
      ejecutadoPor: nombreDelAutor(this.cifrador, fila.ejecutadoPor),
      ocurridoEn: fila.ocurridoEn,
      detalle: fila.detalle as CambioRegistrado['detalle'],
    }));
  }

  private cambio(adicional: Adicional, cambio: CambioAuditado) {
    return {
      accion: cambio.accion,
      nombreDelAdicional: adicional.resumen.nombre,
      ejecutadoPorId: cambio.ejecutadoPorId,
      ocurridoEn: cambio.ocurridoEn,
      ...(cambio.detalle && {
        detalle: cambio.detalle as Prisma.InputJsonObject,
      }),
    };
  }
}
