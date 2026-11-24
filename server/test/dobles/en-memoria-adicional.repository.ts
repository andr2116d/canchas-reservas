import {
  Adicional,
  type FichaDeAdicional,
} from '../../src/modulos/adicionales/dominio/adicional.entity';
import type {
  AdicionalRepository,
  Autoria,
  CambioAuditado,
  CambioRegistrado,
} from '../../src/modulos/adicionales/dominio/adicional.repository';

/** Adicionales y su auditoría en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaAdicionalRepository implements AdicionalRepository {
  private readonly filas = new Map<number, FichaDeAdicional>();
  readonly auditoria: (CambioAuditado & { nombreDelAdicional: string })[] = [];
  private siguienteId = 1;

  listar(): Promise<Adicional[]> {
    return Promise.resolve(
      [...this.filas].map(([id, ficha]) => Adicional.restaurar(id, ficha)),
    );
  }

  buscar(id: number): Promise<Adicional | undefined> {
    const ficha = this.filas.get(id);
    return Promise.resolve(ficha && Adicional.restaurar(id, ficha));
  }

  async nombreOcupado(
    normalizado: string,
    exceptoId?: number,
  ): Promise<boolean> {
    return (await this.listar()).some(
      (a) => a.id !== exceptoId && a.nombreNormalizado === normalizado,
    );
  }

  registrar(adicional: Adicional, autoria: Autoria): Promise<Adicional> {
    const id = this.siguienteId++;
    this.filas.set(id, adicional.ficha);
    this.anotar(adicional, {
      ...autoria,
      accion: 'ALTA',
      detalle: adicional.resumen,
    });
    return Promise.resolve(Adicional.restaurar(id, adicional.ficha));
  }

  guardar(adicional: Adicional, cambio: CambioAuditado): Promise<void> {
    this.filas.set(adicional.id!, adicional.ficha);
    this.anotar(adicional, cambio);
    return Promise.resolve();
  }

  eliminar(adicional: Adicional, autoria: Autoria): Promise<void> {
    this.filas.delete(adicional.id!);
    this.anotar(adicional, { ...autoria, accion: 'ELIMINACION' });
    return Promise.resolve();
  }

  cambios(limite: number): Promise<CambioRegistrado[]> {
    return Promise.resolve(
      [...this.auditoria]
        .reverse()
        .slice(0, limite)
        .map((cambio) => ({
          accion: cambio.accion,
          nombreDelAdicional: cambio.nombreDelAdicional,
          ejecutadoPor: `Administración ${cambio.ejecutadoPorId}`,
          ocurridoEn: cambio.ocurridoEn,
          detalle: cambio.detalle ?? null,
        })),
    );
  }

  private anotar(adicional: Adicional, cambio: CambioAuditado): void {
    this.auditoria.push({
      ...cambio,
      nombreDelAdicional: adicional.resumen.nombre,
    });
  }
}
