import { Inject, Injectable } from '@nestjs/common';
import { ConflictoError } from '../../../../compartido/dominio/dominio.error';
import {
  COLUMNAS_DEL_AUTOR,
  nombreDelAutor,
} from '../../../../compartido/infraestructura/cifrado/nombre-del-autor';
import { VersionesLeidas } from '../../../../compartido/infraestructura/prisma/versiones-leidas';
import type { Prisma } from '../../../../generated/prisma/client';
import type { FiltroDeHojas } from '../../dominio/filtro-de-hojas';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { fechaEnLima } from '../../../../compartido/dominio/momento-en-lima';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { HojaDeReclamacion } from '../../dominio/hoja-de-reclamacion.entity';
import type {
  Autoria,
  CambioDeLaHoja,
  CambioRegistrado,
  HojaRepository,
  PaginaDeHojas,
  RegistroDeHoja,
} from '../../dominio/hoja.repository';
import { NumeroDeHoja } from '../../dominio/numero-de-hoja.value-object';
import {
  conteosPorEstado,
  dondeDelEstado,
  dondeSinEstado,
  ordenDe,
} from './consulta-de-hojas';
import { type FilaDeHoja, HojaMapper } from './hoja.mapper';

const CAMBIO_SIMULTANEO =
  'La hoja cambió mientras se guardaba. Vuelve a abrirla para ver lo último.';

/** Hojas en PostgreSQL: datos personales y textos libres cifrados, y el código solo como hash. */
@Injectable()
export class PrismaHojaRepository implements HojaRepository {
  private readonly mapper: HojaMapper;
  private readonly versiones = new VersionesLeidas<HojaDeReclamacion>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {
    this.mapper = new HojaMapper(cifrador);
  }

  async registrar(
    hoja: HojaDeReclamacion,
    { codigo, titularId }: RegistroDeHoja,
  ): Promise<NumeroDeHoja> {
    const anio = Number(fechaEnLima(hoja.registradaEn).slice(0, 4));
    return this.prisma.$transaction(async (tx) => {
      // Un solo UPDATE sube el correlativo: dos hojas a la vez nunca reciben el mismo número.
      const [{ ultimo }] = await tx.$queryRaw<{ ultimo: number }[]>`
        INSERT INTO correlativo_de_hoja (anio, ultimo) VALUES (${anio}, 1)
        ON CONFLICT (anio) DO UPDATE SET ultimo = correlativo_de_hoja.ultimo + 1
        RETURNING ultimo`;
      await tx.hojaDeReclamacion.create({
        data: {
          anio,
          correlativo: ultimo,
          codigoSeguimientoHash: this.cifrador.hashParaBuscar(codigo),
          titularId,
          ...this.mapper.aColumnas(hoja),
        },
      });
      return NumeroDeHoja.de(anio, ultimo);
    });
  }

  async buscarPorSeguimiento(numero: NumeroDeHoja, codigo: string) {
    const fila = await this.prisma.hojaDeReclamacion.findFirst({
      where: {
        anio: numero.anio,
        correlativo: numero.correlativo,
        codigoSeguimientoHash: this.cifrador.hashParaBuscar(codigo),
      },
    });
    return fila ? this.mapper.aHoja(fila) : undefined;
  }

  async delTitular(titularId: number) {
    const filas = await this.prisma.hojaDeReclamacion.findMany({
      where: { titularId },
      orderBy: { registradaEn: 'desc' },
    });
    return filas.map((fila) => this.mapper.aHoja(fila));
  }

  async buscarDelTitular(titularId: number, numero: NumeroDeHoja) {
    const fila = await this.prisma.hojaDeReclamacion.findFirst({
      where: { titularId, anio: numero.anio, correlativo: numero.correlativo },
    });
    return fila ? this.mapper.aHoja(fila) : undefined;
  }

  async listar(filtro: FiltroDeHojas, hoy: string): Promise<PaginaDeHojas> {
    const base = dondeSinEstado(filtro);
    const donde = { ...base, ...dondeDelEstado(filtro.estado, hoy) };
    const [filas, total, porEstado, vencidas] = await this.prisma.$transaction([
      this.prisma.hojaDeReclamacion.findMany({
        where: donde,
        orderBy: ordenDe(filtro),
        skip: (filtro.pagina - 1) * filtro.porPagina,
        take: filtro.porPagina,
      }),
      this.prisma.hojaDeReclamacion.count({ where: donde }),
      this.prisma.hojaDeReclamacion.groupBy({
        by: ['estado'],
        where: base,
        orderBy: { estado: 'asc' },
        _count: { _all: true },
      }),
      this.prisma.hojaDeReclamacion.count({
        where: { ...base, ...dondeDelEstado('VENCIDAS', hoy) },
      }),
    ]);
    return {
      hojas: filas.map((fila) => this.mapper.aHoja(fila)),
      total,
      conteos: conteosPorEstado(porEstado, vencidas),
    };
  }

  async buscar(numero: NumeroDeHoja) {
    const fila = await this.prisma.hojaDeReclamacion.findUnique({
      where: {
        anio_correlativo: {
          anio: numero.anio,
          correlativo: numero.correlativo,
        },
      },
    });
    return fila ? this.recordar(fila) : undefined;
  }

  /** Solo la abre si sigue nueva: dos aperturas a la vez dejan un solo registro. */
  async registrarApertura(
    hoja: HojaDeReclamacion,
    autoria: Autoria,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.hojaDeReclamacion.updateMany({
        where: { id: hoja.id!, estado: 'NUEVA' },
        data: {
          estado: 'EN_ATENCION',
          abiertaEn: autoria.ocurridoEn,
          version: { increment: 1 },
        },
      });
      if (count === 1)
        await this.auditar(tx, hoja, { ...autoria, accion: 'APERTURA' });
      return count === 1;
    });
  }

  async guardar(
    hoja: HojaDeReclamacion,
    cambio: CambioDeLaHoja,
  ): Promise<void> {
    const version = this.versiones.de(hoja);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.hojaDeReclamacion.updateMany({
        where: { id: hoja.id!, version },
        data: {
          ...this.mapper.aColumnasDeAtencion(hoja),
          ...(cambio.accion === 'RESPUESTA' && {
            respondidaPorId: cambio.ejecutadoPorId,
          }),
          version: { increment: 1 },
        },
      });
      if (count === 0) throw new ConflictoError(CAMBIO_SIMULTANEO, {});
      await this.auditar(tx, hoja, cambio);
    });
    this.versiones.recordar(hoja, version + 1);
  }

  async titularDe(hoja: HojaDeReclamacion): Promise<number | null> {
    const fila = await this.prisma.hojaDeReclamacion.findUniqueOrThrow({
      where: { id: hoja.id! },
      select: { titularId: true },
    });
    return fila.titularId;
  }

  async cambiosDe(hoja: HojaDeReclamacion): Promise<CambioRegistrado[]> {
    const filas = await this.prisma.cambioDeHoja.findMany({
      where: { hojaId: hoja.id! },
      orderBy: [{ ocurridoEn: 'asc' }, { id: 'asc' }],
      include: { ejecutadoPor: { select: COLUMNAS_DEL_AUTOR } },
    });
    return filas.map((fila) => ({
      accion: fila.accion,
      ejecutadoPor: nombreDelAutor(this.cifrador, fila.ejecutadoPor),
      ocurridoEn: fila.ocurridoEn,
      detalle: (fila.detalle as Record<string, unknown> | null) ?? null,
    }));
  }

  private recordar(fila: FilaDeHoja): HojaDeReclamacion {
    return this.versiones.recordar(this.mapper.aHoja(fila), fila.version);
  }

  private async auditar(
    tx: Prisma.TransactionClient,
    hoja: HojaDeReclamacion,
    { accion, detalle, ejecutadoPorId, ocurridoEn }: CambioDeLaHoja,
  ): Promise<void> {
    await tx.cambioDeHoja.create({
      data: {
        hojaId: hoja.id!,
        accion,
        detalle: (detalle ?? undefined) as Prisma.InputJsonValue | undefined,
        ejecutadoPorId,
        ocurridoEn,
      },
    });
  }
}
