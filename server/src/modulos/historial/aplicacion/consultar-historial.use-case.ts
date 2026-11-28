import type { Accion, Categoria } from '../dominio/categorias-del-historial';
import { describirRegistro } from '../dominio/describir-registro';
import {
  type DatosDelFiltro,
  leerFiltroDelHistorial,
} from '../dominio/filtro-del-historial';
import type {
  Autor,
  AutorDelRegistro,
  HistorialRepository,
} from '../dominio/historial.repository';
import type { LineaDeDetalle } from '../dominio/linea-de-detalle';

/** Un registro como lo ve administración: quién, cuándo, qué y el detalle escrito para leerse. */
export interface VistaDeRegistro {
  id: string;
  ocurridoEn: string;
  categoria: Categoria;
  accion: Accion;
  importante: boolean;
  autor: AutorDelRegistro;
  sujeto: string | null;
  detalle: LineaDeDetalle[];
}

export interface PaginaDelHistorial {
  registros: VistaDeRegistro[];
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
}

/** Consulta de solo lectura del historial de cambios, por páginas y con filtros combinables. */
export class ConsultarHistorialUseCase {
  constructor(private readonly historial: HistorialRepository) {}

  async consultar(datos: DatosDelFiltro): Promise<PaginaDelHistorial> {
    const filtro = leerFiltroDelHistorial(datos);
    const { registros, total } = await this.historial.buscar(filtro);
    return {
      registros: registros.map(({ ocurridoEn, ...registro }) => ({
        id: registro.id,
        ocurridoEn: ocurridoEn.toISOString(),
        categoria: registro.categoria,
        accion: registro.accion,
        importante: registro.importante,
        autor: registro.autor,
        ...describirRegistro(registro),
      })),
      total,
      pagina: filtro.pagina,
      porPagina: filtro.porPagina,
      paginas: Math.ceil(total / filtro.porPagina),
    };
  }

  autores(): Promise<Autor[]> {
    return this.historial.autores();
  }
}
