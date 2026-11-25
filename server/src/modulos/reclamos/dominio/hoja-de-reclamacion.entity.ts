import type { Monto } from '../../../compartido/dominio/monto.value-object';
import {
  type Consumidor,
  type DatosDeLaHoja,
  leerDatosDeLaHoja,
  type Representante,
} from './lectura-de-la-hoja';
import type {
  EstadoDeHoja,
  MedioDeRespuesta,
  Motivo,
  Servicio,
  TipoDeHoja,
} from './opciones-de-la-hoja';
import type { NumeroDeHoja } from './numero-de-hoja.value-object';
import { fechaLimiteDeRespuesta } from './plazo-de-respuesta';

export type { DatosDeLaHoja } from './lectura-de-la-hoja';

export interface ServicioContratado {
  servicio: Servicio;
  montoReclamado: Monto | null;
  descripcion: string | null;
}

/** Lo que guarda una hoja. El número lo asigna la base al registrarla. */
export interface PropiedadesDeLaHoja {
  consumidor: Consumidor;
  representante: Representante | null;
  servicio: ServicioContratado;
  /** Lo que marcó la persona; `tipo` puede cambiar si administración la tramita como reclamo. */
  tipoMarcado: TipoDeHoja;
  tipo: TipoDeHoja;
  detalle: string;
  pedido: string;
  medioDeRespuesta: MedioDeRespuesta;
  estado: EstadoDeHoja;
  motivo: Motivo | null;
  registradaEn: Date;
  fechaLimite: string;
}

/** Hoja del Libro de Reclamaciones (DS 011-2011-PCM, art. 5): lo que pide y cómo se atiende. */
export class HojaDeReclamacion {
  private constructor(
    readonly id: number | null,
    /** Lo asigna la base al registrarla; `null` antes de guardarla. */
    readonly numero: NumeroDeHoja | null,
    private propiedades: PropiedadesDeLaHoja,
  ) {}

  static registrar(
    datos: DatosDeLaHoja,
    registradaEn: Date,
  ): HojaDeReclamacion {
    const { consumidor, representante, reclamo } = leerDatosDeLaHoja(datos);
    return new HojaDeReclamacion(null, null, {
      consumidor: {
        documento: {
          tipo: consumidor.numeroDocumento.tipo,
          numero: consumidor.numeroDocumento.numero,
        },
        nombres: consumidor.nombres,
        apellidos: consumidor.apellidos,
        domicilio: consumidor.domicilio,
        telefono: consumidor.telefono,
        correo: consumidor.correo,
      },
      representante: representante && {
        nombre: representante.representanteNombre,
        domicilio: representante.representanteDomicilio,
        telefono: representante.representanteTelefono,
        correo: representante.representanteCorreo,
      },
      servicio: {
        servicio: reclamo.servicio,
        montoReclamado: reclamo.montoReclamado,
        descripcion: reclamo.descripcionDelServicio,
      },
      tipoMarcado: reclamo.tipo,
      tipo: reclamo.tipo,
      detalle: reclamo.detalle,
      pedido: reclamo.pedido,
      medioDeRespuesta: reclamo.medioDeRespuesta,
      estado: 'NUEVA',
      motivo: null,
      registradaEn,
      fechaLimite: fechaLimiteDeRespuesta(registradaEn),
    });
  }

  static restaurar(
    id: number,
    numero: NumeroDeHoja,
    propiedades: PropiedadesDeLaHoja,
  ): HojaDeReclamacion {
    return new HojaDeReclamacion(id, numero, { ...propiedades });
  }

  /** Todo lo que guarda la hoja, para la persistencia y las vistas. */
  get datos(): Readonly<PropiedadesDeLaHoja> {
    return this.propiedades;
  }

  get consumidor() {
    return this.propiedades.consumidor;
  }
  get representante() {
    return this.propiedades.representante;
  }
  get servicio() {
    return this.propiedades.servicio;
  }
  get tipoMarcado() {
    return this.propiedades.tipoMarcado;
  }
  get tipo() {
    return this.propiedades.tipo;
  }
  get detalle() {
    return this.propiedades.detalle;
  }
  get pedido() {
    return this.propiedades.pedido;
  }
  get medioDeRespuesta() {
    return this.propiedades.medioDeRespuesta;
  }
  get estado() {
    return this.propiedades.estado;
  }
  get motivo() {
    return this.propiedades.motivo;
  }
  get registradaEn() {
    return this.propiedades.registradaEn;
  }
  get fechaLimite() {
    return this.propiedades.fechaLimite;
  }
}
