import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';
import { fechaEnLima } from '../../../compartido/dominio/momento-en-lima';
import type { HojaRepository } from '../dominio/hoja.repository';
import { NumeroDeHoja } from '../dominio/numero-de-hoja.value-object';
import {
  type ResumenDeHoja,
  verResumen,
  verSeguimiento,
  type VistaDeSeguimiento,
} from './vista-de-seguimiento';

const NO_ESTA_EN_LA_CUENTA = 'No encontramos esa hoja en la cuenta.';

/** Un número mal escrito en la dirección se trata como una hoja que no existe. */
function leerNumero(texto: string): NumeroDeHoja | null {
  try {
    return NumeroDeHoja.leer(texto);
  } catch {
    return null;
  }
}

/** «Mis reclamos»: las hojas que un jugador registró con su cuenta. Nunca las de otra persona. */
export class MisHojasUseCase {
  constructor(
    private readonly hojas: HojaRepository,
    private readonly reloj: Reloj,
  ) {}

  async listar(titularId: number): Promise<ResumenDeHoja[]> {
    const hoy = fechaEnLima(this.reloj.ahora());
    return (await this.hojas.delTitular(titularId)).map((h) =>
      verResumen(h, hoy),
    );
  }

  async ver(titularId: number, numero: string): Promise<VistaDeSeguimiento> {
    const leido = leerNumero(numero);
    const hoja = leido && (await this.hojas.buscarDelTitular(titularId, leido));
    if (!hoja) throw new NoEncontradoError(NO_ESTA_EN_LA_CUENTA);
    return verSeguimiento(hoja, fechaEnLima(this.reloj.ahora()));
  }
}
