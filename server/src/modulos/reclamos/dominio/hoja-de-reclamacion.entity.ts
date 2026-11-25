import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import type { Monto } from '../../../compartido/dominio/monto.value-object';
import {
  type Consumidor,
  type DatosDeLaHoja,
  leerDatosDeLaHoja,
  type Representante,
} from './lectura-de-la-hoja';
import {
  elegir,
  type EstadoDeHoja,
  type MedioDeRespuesta,
  type Motivo,
  MOTIVOS,
  type Servicio,
  type TipoDeHoja,
} from './opciones-de-la-hoja';
import type { NumeroDeHoja } from './numero-de-hoja.value-object';
import { fechaLimiteDeRespuesta } from './plazo-de-respuesta';
import {
  type DatosDeLaRespuesta,
  fechaDeComunicacion,
  leerRespuesta,
  type RespuestaDeLaHoja,
} from './respuesta-de-la-hoja';
import { validarCampos } from '../../../compartido/dominio/validar-campos';

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
  /** Cuándo administración la abrió por primera vez. */
  abiertaEn: Date | null;
  respuesta: RespuestaDeLaHoja | null;
}

/** Un cambio con su valor anterior y el nuevo, para la auditoría. */
export interface Cambio<T> {
  antes: T;
  despues: T;
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
      abiertaEn: null,
      respuesta: null,
    });
  }

  static restaurar(
    id: number,
    numero: NumeroDeHoja,
    propiedades: PropiedadesDeLaHoja,
  ): HojaDeReclamacion {
    return new HojaDeReclamacion(id, numero, { ...propiedades });
  }

  /** La primera vez que administración la abre pasa a «en atención». Devuelve si cambió. */
  abrir(momento: Date): boolean {
    if (this.propiedades.estado !== 'NUEVA') return false;
    this.propiedades.estado = 'EN_ATENCION';
    this.propiedades.abiertaEn = momento;
    return true;
  }

  /** Clasificación interna; devuelve el cambio o `null` si el motivo ya era ese. */
  clasificar(texto: string): Cambio<Motivo | null> | null {
    const { motivo } = validarCampos({
      motivo: () => elegir(texto, MOTIVOS, 'Elige un motivo de la lista.'),
    });
    const antes = this.propiedades.motivo;
    if (antes === motivo) return null;
    this.propiedades.motivo = motivo;
    return { antes, despues: motivo };
  }

  /** Si una queja describe un problema con el servicio, se tramita como reclamo (DS 101-2022-PCM). */
  tramitarComoReclamo(): void {
    if (this.propiedades.respuesta) {
      throw new ConflictoError(
        'La hoja ya fue respondida: su tipo ya no cambia.',
        {},
      );
    }
    if (this.propiedades.tipo === 'RECLAMO') {
      throw new ConflictoError('Esta hoja ya se tramita como reclamo.', {});
    }
    this.propiedades.tipo = 'RECLAMO';
  }

  /** Registra las acciones adoptadas. Una vez respondida, la respuesta no se cambia. */
  responder(datos: DatosDeLaRespuesta, momento: Date): void {
    if (this.propiedades.respuesta) {
      throw new ConflictoError(
        'La hoja ya fue respondida. La respuesta no se cambia.',
        {},
      );
    }
    this.propiedades.respuesta = leerRespuesta(datos, {
      medio: this.propiedades.medioDeRespuesta,
      registradaEn: this.propiedades.registradaEn,
      ahora: momento,
    });
    this.propiedades.abiertaEn ??= momento;
    this.propiedades.estado = 'RESPONDIDA';
  }

  /** Respondida después de la fecha límite, contando el día en que la respuesta se comunicó. */
  get fueraDePlazo(): boolean {
    const { respuesta, fechaLimite } = this.propiedades;
    return respuesta !== null && fechaDeComunicacion(respuesta) > fechaLimite;
  }

  get abiertaEn() {
    return this.propiedades.abiertaEn;
  }

  get respuesta() {
    return this.propiedades.respuesta;
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
