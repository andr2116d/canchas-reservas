import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { DuracionDelTurno } from '../dominio/duracion-del-turno.value-object';
import { Monto } from '../dominio/monto.value-object';
import { Tarifa } from '../dominio/tarifa';
import type { TipoDeCancha } from '../dominio/tipo-de-cancha';

/** Datos tal como los escribe el administrador. */
export interface DatosDeTarifa {
  precioDia: string;
  precioNoche: string;
  duracionDelTurno: string;
  ofreceTurnoCorto: boolean;
}

/** Construye la tarifa y reúne los errores de cada dato en una sola respuesta. */
export function construirTarifa(
  tipo: TipoDeCancha,
  datos: DatosDeTarifa,
): Tarifa {
  const campos = validarCampos({
    precioDia: () => Monto.crear(datos.precioDia),
    precioNoche: () => Monto.crear(datos.precioNoche),
    duracionDelTurno: () => DuracionDelTurno.crear(datos.duracionDelTurno),
  });
  return new Tarifa({
    tipo,
    precioDia: campos.precioDia,
    precioNoche: campos.precioNoche,
    duracion: campos.duracionDelTurno,
    ofreceTurnoCorto: datos.ofreceTurnoCorto,
  });
}
