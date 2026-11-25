import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import type { HojaDeReclamacion } from '../../../src/modulos/reclamos/dominio/hoja-de-reclamacion.entity';
import type {
  HojaRepository,
  RegistroDeHoja,
} from '../../../src/modulos/reclamos/dominio/hoja.repository';
import { NumeroDeHoja } from '../../../src/modulos/reclamos/dominio/numero-de-hoja.value-object';

interface HojaGuardada extends RegistroDeHoja {
  numero: NumeroDeHoja;
  hoja: HojaDeReclamacion;
}

/** Hojas en memoria, numeradas por año como en la base. */
export class EnMemoriaHojaRepository implements HojaRepository {
  readonly guardadas: HojaGuardada[] = [];

  registrar(
    hoja: HojaDeReclamacion,
    registro: RegistroDeHoja,
  ): Promise<NumeroDeHoja> {
    const anio = Number(fechaEnLima(hoja.registradaEn).slice(0, 4));
    const delAnio = this.guardadas.filter((g) => g.numero.anio === anio).length;
    const numero = NumeroDeHoja.de(anio, delAnio + 1);
    this.guardadas.push({ ...registro, numero, hoja });
    return Promise.resolve(numero);
  }
}
