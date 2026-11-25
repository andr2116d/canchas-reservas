import { Injectable } from '@nestjs/common';
import type {
  DatosDelProveedor,
  Proveedor,
} from '../../aplicacion/datos-del-proveedor.port';

/**
 * Administración aún no tiene dónde guardar la razón social, el RUC y la dirección. Mientras
 * tanto la hoja los muestra como pendientes; se reemplaza cuando exista esa pantalla.
 */
@Injectable()
export class SinDatosDelProveedorAdapter implements DatosDelProveedor {
  consultar(): Promise<Proveedor> {
    return Promise.resolve({ razonSocial: null, ruc: null, direccion: null });
  }
}
