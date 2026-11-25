import type { Cifrador } from '../../../../compartido/aplicacion/cifrador.port';
import { Monto } from '../../../../compartido/dominio/monto.value-object';
import type { Prisma } from '../../../../generated/prisma/client';
import { HojaDeReclamacion } from '../../dominio/hoja-de-reclamacion.entity';
import { NumeroDeHoja } from '../../dominio/numero-de-hoja.value-object';

export type FilaDeHoja = Prisma.HojaDeReclamacionGetPayload<object>;

/** Traduce entre la hoja y su fila: cifra al guardar y descifra al leer. */
export class HojaMapper {
  constructor(private readonly cifrador: Cifrador) {}

  aColumnas(hoja: HojaDeReclamacion) {
    const cifrar = (texto: string) => this.cifrador.cifrar(texto);
    const siHay = (texto: string | null | undefined) =>
      texto ? cifrar(texto) : null;
    const { consumidor: c, representante: r, servicio: s } = hoja.datos;
    return {
      tipoDocumento: c.documento.tipo as 'DNI' | 'CARNE_EXTRANJERIA',
      numeroDocumentoCifrado: cifrar(c.documento.numero),
      nombresCifrado: cifrar(c.nombres),
      apellidosCifrado: cifrar(c.apellidos),
      domicilioCifrado: cifrar(c.domicilio),
      telefonoCifrado: cifrar(c.telefono),
      correoCifrado: cifrar(c.correo),
      esMenorDeEdad: r !== null,
      representanteNombreCifrado: siHay(r?.nombre),
      representanteDomicilioCifrado: siHay(r?.domicilio),
      representanteTelefonoCifrado: siHay(r?.telefono),
      representanteCorreoCifrado: siHay(r?.correo),
      servicio: s.servicio,
      montoReclamado: s.montoReclamado?.enSoles() ?? null,
      descripcionDelServicioCifrada: siHay(s.descripcion),
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

  aHoja(fila: FilaDeHoja): HojaDeReclamacion {
    const leer = (texto: string) => this.cifrador.descifrar(texto);
    const siHay = (texto: string | null) => (texto ? leer(texto) : null);
    return HojaDeReclamacion.restaurar(
      fila.id,
      NumeroDeHoja.de(fila.anio, fila.correlativo),
      {
        consumidor: {
          documento: {
            tipo: fila.tipoDocumento,
            numero: leer(fila.numeroDocumentoCifrado),
          },
          nombres: leer(fila.nombresCifrado),
          apellidos: leer(fila.apellidosCifrado),
          domicilio: leer(fila.domicilioCifrado),
          telefono: leer(fila.telefonoCifrado),
          correo: leer(fila.correoCifrado),
        },
        representante: fila.esMenorDeEdad
          ? {
              nombre: leer(fila.representanteNombreCifrado ?? ''),
              domicilio: leer(fila.representanteDomicilioCifrado ?? ''),
              telefono: leer(fila.representanteTelefonoCifrado ?? ''),
              correo: leer(fila.representanteCorreoCifrado ?? ''),
            }
          : null,
        servicio: {
          servicio: fila.servicio,
          montoReclamado: fila.montoReclamado
            ? Monto.desdeCentimos(fila.montoReclamado.mul(100).toNumber())
            : null,
          descripcion: siHay(fila.descripcionDelServicioCifrada),
        },
        tipoMarcado: fila.tipoMarcado,
        tipo: fila.tipo,
        detalle: leer(fila.detalleCifrado),
        pedido: leer(fila.pedidoCifrado),
        medioDeRespuesta: fila.medioDeRespuesta,
        estado: fila.estado,
        motivo: null,
        registradaEn: fila.registradaEn,
        fechaLimite: fila.fechaLimite.toISOString().slice(0, 10),
      },
    );
  }
}
