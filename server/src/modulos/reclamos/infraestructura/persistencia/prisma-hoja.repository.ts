import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { fechaEnLima } from '../../../../compartido/dominio/momento-en-lima';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { HojaDeReclamacion } from '../../dominio/hoja-de-reclamacion.entity';
import type {
  HojaRepository,
  RegistroDeHoja,
} from '../../dominio/hoja.repository';
import { NumeroDeHoja } from '../../dominio/numero-de-hoja.value-object';
import { HojaMapper } from './hoja.mapper';

/** Hojas en PostgreSQL: datos personales y textos libres cifrados, y el código solo como hash. */
@Injectable()
export class PrismaHojaRepository implements HojaRepository {
  private readonly mapper: HojaMapper;

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
}
