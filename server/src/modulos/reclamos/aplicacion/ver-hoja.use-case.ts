import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { fechaEnLima } from '../../../compartido/dominio/momento-en-lima';
import type { HojaRepository } from '../dominio/hoja.repository';
import { buscarHoja } from './buscar-hoja';
import {
  type HojaParaAtender,
  verParaAtender,
} from './vista-para-administracion';

/** Una hoja completa para administración. Solo lee: abrirla es otra acción. */
export class VerHojaUseCase {
  constructor(
    private readonly hojas: HojaRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(numero: string): Promise<HojaParaAtender> {
    const hoja = await buscarHoja(this.hojas, numero);
    const cambios = await this.hojas.cambiosDe(hoja);
    return verParaAtender(hoja, fechaEnLima(this.reloj.ahora()), cambios);
  }
}
