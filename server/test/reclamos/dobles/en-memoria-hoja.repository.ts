import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import { HojaDeReclamacion } from '../../../src/modulos/reclamos/dominio/hoja-de-reclamacion.entity';
import type {
  HojaRepository,
  RegistroDeHoja,
} from '../../../src/modulos/reclamos/dominio/hoja.repository';
import { NumeroDeHoja } from '../../../src/modulos/reclamos/dominio/numero-de-hoja.value-object';

interface HojaGuardada extends RegistroDeHoja {
  numero: NumeroDeHoja;
  hoja: HojaDeReclamacion;
}

const mismoNumero = (a: NumeroDeHoja, b: NumeroDeHoja) =>
  a.anio === b.anio && a.correlativo === b.correlativo;

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
    const guardada = HojaDeReclamacion.restaurar(
      this.guardadas.length + 1,
      numero,
      hoja.datos,
    );
    this.guardadas.push({ ...registro, numero, hoja: guardada });
    return Promise.resolve(numero);
  }

  buscarPorSeguimiento(numero: NumeroDeHoja, codigo: string) {
    const guardada = this.guardadas.find(
      (g) => mismoNumero(g.numero, numero) && g.codigo === codigo,
    );
    return Promise.resolve(guardada?.hoja);
  }

  delTitular(titularId: number) {
    return Promise.resolve(
      this.guardadas
        .filter((g) => g.titularId === titularId)
        .map((g) => g.hoja)
        .reverse(),
    );
  }

  buscarDelTitular(titularId: number, numero: NumeroDeHoja) {
    const guardada = this.guardadas.find(
      (g) => g.titularId === titularId && mismoNumero(g.numero, numero),
    );
    return Promise.resolve(guardada?.hoja);
  }
}
