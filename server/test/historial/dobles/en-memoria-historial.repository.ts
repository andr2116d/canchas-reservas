import type { FiltroDelHistorial } from '../../../src/modulos/historial/dominio/filtro-del-historial';
import type {
  Autor,
  HistorialRepository,
  RegistroGuardado,
} from '../../../src/modulos/historial/dominio/historial.repository';

/** Historial en memoria que aplica los mismos filtros que la base, para probar el caso de uso. */
export class EnMemoriaHistorialRepository implements HistorialRepository {
  readonly registros: RegistroGuardado[] = [];
  readonly personas: Autor[] = [];

  buscar(
    filtro: FiltroDelHistorial,
  ): Promise<{ registros: RegistroGuardado[]; total: number }> {
    const cumplen = this.registros
      .filter(
        (r) =>
          (filtro.autorId === undefined || r.autor.id === filtro.autorId) &&
          (!filtro.categoria || r.categoria === filtro.categoria) &&
          (!filtro.accion || r.accion === filtro.accion) &&
          (!filtro.desde || r.ocurridoEn >= filtro.desde) &&
          (!filtro.antesDe || r.ocurridoEn < filtro.antesDe) &&
          (!filtro.soloImportantes || r.importante),
      )
      .sort((a, b) =>
        filtro.orden === 'RECIENTES'
          ? b.ocurridoEn.getTime() - a.ocurridoEn.getTime()
          : a.ocurridoEn.getTime() - b.ocurridoEn.getTime(),
      );
    const inicio = (filtro.pagina - 1) * filtro.porPagina;
    return Promise.resolve({
      registros: cumplen.slice(inicio, inicio + filtro.porPagina),
      total: cumplen.length,
    });
  }

  autores(): Promise<Autor[]> {
    return Promise.resolve(this.personas);
  }
}
