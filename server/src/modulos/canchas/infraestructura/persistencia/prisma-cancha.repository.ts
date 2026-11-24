import {
  COLUMNAS_DEL_AUTOR,
  nombreDelAutor,
} from '../../../../compartido/infraestructura/cifrado/nombre-del-autor';
import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { ConflictoError } from '../../../../compartido/dominio/dominio.error';
import { VersionesLeidas } from '../../../../compartido/infraestructura/prisma/versiones-leidas';
import { indiceUnicoViolado } from '../../../../compartido/infraestructura/prisma/indice-unico-violado';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { Cancha } from '../../dominio/cancha.entity';
import { CanchaNoEncontradaError } from '../../dominio/cancha-no-encontrada.error';
import type {
  Autoria,
  CambioAuditado,
  CambioRegistrado,
  CanchaRepository,
} from '../../dominio/cancha.repository';

type FilaDeCancha = Prisma.CanchaGetPayload<object>;

const CON_AUTOR = {
  ejecutadoPor: { select: COLUMNAS_DEL_AUTOR },
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

type Transaccion = Prisma.TransactionClient;

/** Canchas sobre PostgreSQL; cada escritura deja su cambio en la auditoría en la misma transacción. */
@Injectable()
export class PrismaCanchaRepository implements CanchaRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  private readonly versiones = new VersionesLeidas<Cancha>();

  private leer = (fila: FilaDeCancha): Cancha =>
    this.versiones.recordar(aCancha(fila), fila.version);

  async listar(): Promise<Cancha[]> {
    const filas = await this.prisma.cancha.findMany({ orderBy: { id: 'asc' } });
    return filas.map(this.leer);
  }

  async buscar(id: number): Promise<Cancha | undefined> {
    const fila = await this.prisma.cancha.findUnique({ where: { id } });
    return fila ? this.leer(fila) : undefined;
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
      .then((filas) => filas.sort((a, b) => a.id - b.id).map(this.leer))
      .catch(rechazarNombreRepetido);
  }

  /** Guarda solo si nadie la cambió desde que se leyó; si no, avisa en vez de pisar ese cambio. */
  async guardar(cancha: Cancha, cambio: CambioAuditado): Promise<void> {
    const version = this.versiones.de(cancha);
    await this.prisma
      .$transaction(async (tx) => {
        const { count } = await tx.cancha.updateMany({
          where: { id: cancha.id, version },
          data: { ...aFila(cancha), version: { increment: 1 } },
        });
        if (count === 0) throw await this.porQueNoSeEscribio(tx, cancha);
        await tx.cambioDeCancha.create({
          data: { ...this.cambio(cancha, cambio), canchaId: cancha.id },
        });
      })
      .catch(rechazarNombreRepetido);
    this.versiones.recordar(cancha, version + 1);
  }

  async eliminar(cancha: Cancha, autoria: Autoria): Promise<void> {
    const version = this.versiones.de(cancha);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.cancha.deleteMany({
        where: { id: cancha.id, version },
      });
      if (count === 0) throw await this.porQueNoSeEscribio(tx, cancha);
      await tx.cambioDeCancha.create({
        data: this.cambio(cancha, { ...autoria, accion: 'ELIMINACION' }),
      });
    });
  }

  /** Otro dispositivo la eliminó o la cambió entre la lectura y la escritura. */
  private async porQueNoSeEscribio(tx: Transaccion, cancha: Cancha) {
    const sigue = await tx.cancha.count({ where: { id: cancha.id } });
    if (!sigue) return new CanchaNoEncontradaError();
    return new ConflictoError(
      'La cancha cambió mientras se guardaba. Recarga para ver lo último.',
      {},
    );
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
      ejecutadoPor: nombreDelAutor(this.cifrador, fila.ejecutadoPor),
      ocurridoEn: fila.ocurridoEn,
      detalle: fila.detalle as CambioRegistrado['detalle'],
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
