import type {
  Adicional,
  EstadoDeAdicional,
  ResumenDeAdicional,
} from '../dominio/adicional.entity';
import type {
  AccionSobreAdicional,
  CambioRegistrado,
} from '../dominio/adicional.repository';

/** Un adicional como lo ve administración. */
export interface VistaDeAdicional extends ResumenDeAdicional {
  id: number;
  estado: EstadoDeAdicional;
  /** Solo si nunca se usó; si se usó, se desactiva. */
  sePuedeEliminar: boolean;
}

export interface VistaDeCambio {
  accion: AccionSobreAdicional;
  nombreDelAdicional: string;
  ejecutadoPor: string;
  ocurridoEn: string;
  detalle: CambioRegistrado['detalle'];
}

export function aVista(
  adicional: Adicional,
  sePuedeEliminar: boolean,
): VistaDeAdicional {
  return {
    id: adicional.id!,
    ...adicional.resumen,
    estado: adicional.ficha.estado,
    sePuedeEliminar,
  };
}

export function aVistaDeCambio(cambio: CambioRegistrado): VistaDeCambio {
  return { ...cambio, ocurridoEn: cambio.ocurridoEn.toISOString() };
}
