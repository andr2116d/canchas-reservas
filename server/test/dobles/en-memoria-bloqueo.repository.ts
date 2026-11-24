import { Bloqueo } from '../../src/modulos/canchas/dominio/bloqueo.entity';
import type {
  BloqueoDeLaCancha,
  BloqueoRepository,
} from '../../src/modulos/canchas/dominio/bloqueo.repository';
import type {
  AccionSobreCancha,
  Autoria,
} from '../../src/modulos/canchas/dominio/cancha.repository';
import type { Rango } from '../../src/modulos/canchas/dominio/repeticion';

/** Bloqueos en memoria; los nombres de las canchas se dan al crearlo. */
export class EnMemoriaBloqueoRepository implements BloqueoRepository {
  private readonly filas = new Map<number, Bloqueo>();
  readonly auditoria: (Autoria & {
    accion: AccionSobreCancha;
    canchaId: number;
  })[] = [];
  private siguienteId = 1;

  constructor(private readonly nombres: Record<number, string> = {}) {}

  private conCancha = (bloqueo: Bloqueo): BloqueoDeLaCancha => ({
    bloqueo,
    cancha:
      this.nombres[bloqueo.ficha.canchaId] ??
      `Cancha ${bloqueo.ficha.canchaId}`,
  });

  private todos(): Bloqueo[] {
    return [...this.filas.values()];
  }

  chocan(canchaIds: number[], rangos: Rango[]): Promise<BloqueoDeLaCancha[]> {
    return Promise.resolve(
      this.todos()
        .filter((b) => canchaIds.includes(b.ficha.canchaId))
        .filter((b) =>
          rangos.some(
            (r) => b.ficha.inicio < r.fin && r.inicio < b.finEfectivo,
          ),
        )
        .map(this.conCancha),
    );
  }

  registrar(bloqueos: Bloqueo[], autoria: Autoria): Promise<Bloqueo[]> {
    return Promise.resolve(
      bloqueos.map((bloqueo) => {
        const guardado = Bloqueo.restaurar(this.siguienteId++, bloqueo.ficha);
        this.filas.set(guardado.id!, guardado);
        this.anotar('BLOQUEO', guardado, autoria);
        return guardado;
      }),
    );
  }

  buscar(id: number): Promise<BloqueoDeLaCancha | undefined> {
    const bloqueo = this.filas.get(id);
    return Promise.resolve(
      bloqueo && this.conCancha(Bloqueo.restaurar(id, bloqueo.ficha)),
    );
  }

  liberar(bloqueo: Bloqueo, autoria: Autoria): Promise<void> {
    this.filas.set(bloqueo.id!, bloqueo);
    this.anotar('LIBERACION_DE_BLOQUEO', bloqueo, autoria);
    return Promise.resolve();
  }

  quitar(bloqueo: Bloqueo, autoria: Autoria): Promise<void> {
    this.filas.delete(bloqueo.id!);
    this.anotar('RETIRO_DE_BLOQUEO', bloqueo, autoria);
    return Promise.resolve();
  }

  sinTerminar(ahora: Date): Promise<BloqueoDeLaCancha[]> {
    return Promise.resolve(
      this.todos()
        .filter((b) => b.finEfectivo > ahora)
        .sort((a, b) => a.ficha.inicio.getTime() - b.ficha.inicio.getTime())
        .map(this.conCancha),
    );
  }

  terminados(ahora: Date, limite: number): Promise<BloqueoDeLaCancha[]> {
    return Promise.resolve(
      this.todos()
        .filter((b) => b.finEfectivo <= ahora)
        .sort((a, b) => b.finEfectivo.getTime() - a.finEfectivo.getTime())
        .slice(0, limite)
        .map(this.conCancha),
    );
  }

  private anotar(
    accion: AccionSobreCancha,
    bloqueo: Bloqueo,
    autoria: Autoria,
  ): void {
    this.auditoria.push({
      ...autoria,
      accion,
      canchaId: bloqueo.ficha.canchaId,
    });
  }
}
