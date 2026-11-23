import type { EstadoUsuario } from '../../../compartido/dominio/rol-usuario';
import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';
import type {
  FichaConHistorial,
  FichaDeRecepcionista,
  RecepcionistaRepository,
} from '../dominio/recepcionista.repository';

const ORDEN_ALFABETICO = new Intl.Collator('es', { sensitivity: 'base' });

/** Consultas del administrador sobre las cuentas de recepción. */
export class ConsultarRecepcionistasUseCase {
  constructor(
    private readonly recepcionistas: Pick<
      RecepcionistaRepository,
      'listar' | 'buscar'
    >,
  ) {}

  /** Recepcionistas en ese estado, por apellidos y nombres. */
  async listar(estado: EstadoUsuario): Promise<FichaDeRecepcionista[]> {
    const fichas = await this.recepcionistas.listar(estado);
    return fichas.sort(
      (a, b) =>
        ORDEN_ALFABETICO.compare(a.apellidos, b.apellidos) ||
        ORDEN_ALFABETICO.compare(a.nombres, b.nombres),
    );
  }

  async ficha(id: number): Promise<FichaConHistorial> {
    const encontrada = await this.recepcionistas.buscar(id);
    if (!encontrada) {
      throw new NoEncontradoError('No encontramos a esa recepcionista.');
    }
    return encontrada;
  }
}
