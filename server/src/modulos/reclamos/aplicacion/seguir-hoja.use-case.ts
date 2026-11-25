import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';
import { fechaEnLima } from '../../../compartido/dominio/momento-en-lima';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { leerCodigo } from '../dominio/codigo-de-seguimiento';
import type { HojaRepository } from '../dominio/hoja.repository';
import { NumeroDeHoja } from '../dominio/numero-de-hoja.value-object';
import {
  verSeguimiento,
  type VistaDeSeguimiento,
} from './vista-de-seguimiento';

// El mismo mensaje si el número no existe o el código no coincide: no revela qué números existen.
export const HOJA_NO_ENCONTRADA =
  'No encontramos una hoja con ese número y código. Revisa los dos datos de la constancia.';

/** Seguimiento público de una hoja, sin cuenta: pide el número y el código de la constancia. */
export class SeguirHojaUseCase {
  constructor(
    private readonly hojas: HojaRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(numero: string, codigo: string): Promise<VistaDeSeguimiento> {
    const datos = validarCampos({
      numero: () => NumeroDeHoja.leer(numero),
      codigo: () => leerCodigo(codigo),
    });
    const hoja = await this.hojas.buscarPorSeguimiento(
      datos.numero,
      datos.codigo,
    );
    if (!hoja) throw new NoEncontradoError(HOJA_NO_ENCONTRADA);
    return verSeguimiento(hoja, fechaEnLima(this.reloj.ahora()));
  }
}
