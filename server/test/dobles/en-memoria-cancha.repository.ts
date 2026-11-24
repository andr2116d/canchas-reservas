import {
  Cancha,
  type FichaDeCancha,
} from '../../src/modulos/canchas/dominio/cancha.entity';
import type {
  Autoria,
  CambioAuditado,
  CambioRegistrado,
  CanchaRepository,
} from '../../src/modulos/canchas/dominio/cancha.repository';

/** Canchas y su auditoría en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaCanchaRepository implements CanchaRepository {
  private readonly filas = new Map<number, FichaDeCancha>();
  readonly auditoria: (CambioAuditado & { nombreDeLaCancha: string })[] = [];
  private siguienteId = 1;

  listar(): Promise<Cancha[]> {
    return Promise.resolve(
      [...this.filas].map(([id, ficha]) => Cancha.restaurar(id, ficha)),
    );
  }

  buscar(id: number): Promise<Cancha | undefined> {
    const ficha = this.filas.get(id);
    return Promise.resolve(ficha && Cancha.restaurar(id, ficha));
  }

  async nombresOcupados(
    normalizados: string[],
    exceptoId?: number,
  ): Promise<string[]> {
    const otras = (await this.listar()).filter((c) => c.id !== exceptoId);
    const usados = new Set(otras.map((c) => c.nombreNormalizado));
    return normalizados.filter((nombre) => usados.has(nombre));
  }

  registrar(canchas: Cancha[], autoria: Autoria): Promise<Cancha[]> {
    const creadas = canchas.map((cancha) => {
      const id = this.siguienteId++;
      this.filas.set(id, cancha.ficha);
      this.anotar(cancha.ficha.nombre, { ...autoria, accion: 'ALTA' });
      return Cancha.restaurar(id, cancha.ficha);
    });
    return Promise.resolve(creadas);
  }

  guardar(cancha: Cancha, cambio: CambioAuditado): Promise<void> {
    this.filas.set(cancha.id!, cancha.ficha);
    this.anotar(cancha.ficha.nombre, cambio);
    return Promise.resolve();
  }

  eliminar(cancha: Cancha, autoria: Autoria): Promise<void> {
    this.filas.delete(cancha.id!);
    this.anotar(cancha.ficha.nombre, { ...autoria, accion: 'ELIMINACION' });
    return Promise.resolve();
  }

  cambios(limite: number): Promise<CambioRegistrado[]> {
    return Promise.resolve(
      [...this.auditoria]
        .reverse()
        .slice(0, limite)
        .map((cambio) => ({
          accion: cambio.accion,
          nombreDeLaCancha: cambio.nombreDeLaCancha,
          ejecutadoPor: `Administración ${cambio.ejecutadoPorId}`,
          ocurridoEn: cambio.ocurridoEn,
          detalle: cambio.detalle ?? null,
        })),
    );
  }

  private anotar(nombreDeLaCancha: string, cambio: CambioAuditado): void {
    this.auditoria.push({ ...cambio, nombreDeLaCancha });
  }
}
