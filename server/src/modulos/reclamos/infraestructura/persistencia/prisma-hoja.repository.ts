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

/** Hojas en PostgreSQL: datos personales y textos libres cifrados, y el código solo como hash. */
@Injectable()
export class PrismaHojaRepository implements HojaRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

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
          ...this.columnasDeLaHoja(hoja),
        },
      });
      return NumeroDeHoja.de(anio, ultimo);
    });
  }

  private columnasDeLaHoja(hoja: HojaDeReclamacion) {
    const cifrar = (texto: string) => this.cifrador.cifrar(texto);
    const cifrarSiHay = (texto: string | null | undefined) =>
      texto ? cifrar(texto) : null;
    const { consumidor: c, representante: r, servicio: s } = hoja;
    return {
      tipoDocumento: c.documento.tipo as 'DNI' | 'CARNE_EXTRANJERIA',
      numeroDocumentoCifrado: cifrar(c.documento.numero),
      nombresCifrado: cifrar(c.nombres),
      apellidosCifrado: cifrar(c.apellidos),
      domicilioCifrado: cifrar(c.domicilio),
      telefonoCifrado: cifrar(c.telefono),
      correoCifrado: cifrar(c.correo),
      esMenorDeEdad: r !== null,
      representanteNombreCifrado: cifrarSiHay(r?.nombre),
      representanteDomicilioCifrado: cifrarSiHay(r?.domicilio),
      representanteTelefonoCifrado: cifrarSiHay(r?.telefono),
      representanteCorreoCifrado: cifrarSiHay(r?.correo),
      servicio: s.servicio,
      montoReclamado: s.montoReclamado?.enSoles() ?? null,
      descripcionDelServicioCifrada: cifrarSiHay(s.descripcion),
      tipoMarcado: hoja.tipoMarcado,
      tipo: hoja.tipo,
      detalleCifrado: cifrar(hoja.detalle),
      pedidoCifrado: cifrar(hoja.pedido),
      medioDeRespuesta: hoja.medioDeRespuesta,
      estado: hoja.estado,
      registradaEn: hoja.registradaEn,
      fechaLimite: new Date(`${hoja.fechaLimite}T00:00:00.000Z`),
    };
  }
}
