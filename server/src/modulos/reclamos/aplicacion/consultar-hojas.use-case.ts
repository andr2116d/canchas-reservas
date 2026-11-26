import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { fechaEnLima } from '../../../compartido/dominio/momento-en-lima';
import {
  type DatosDelFiltroDeHojas,
  leerFiltroDeHojas,
} from '../dominio/filtro-de-hojas';
import type { HojaRepository } from '../dominio/hoja.repository';
import { verFila } from './vista-para-administracion';

/** La lista de administración: filtros, orden, páginas y cuántas hay en cada estado. */
export class ConsultarHojasUseCase {
  constructor(
    private readonly hojas: HojaRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(datos: DatosDelFiltroDeHojas) {
    const filtro = leerFiltroDeHojas(datos);
    const hoy = fechaEnLima(this.reloj.ahora());
    const { hojas, total, conteos } = await this.hojas.listar(filtro, hoy);
    return {
      hojas: hojas.map((hoja) => verFila(hoja, hoy)),
      total,
      conteos,
      pagina: filtro.pagina,
      porPagina: filtro.porPagina,
    };
  }
}
