/** Lo único que el reparto necesita del caso de uso: una vuelta por la bandeja. */
export interface VueltaDeReparto {
  ejecutar(): Promise<void>;
}

/**
 * Corre las vueltas de reparto de a una. Un pedido que llega durante una vuelta no abre
 * otra en paralelo: deja anotada una vuelta más al terminar la actual.
 */
export class RepartoDeCorreos {
  private enCurso: Promise<void> | null = null;
  private otraVuelta = false;

  constructor(
    private readonly vuelta: VueltaDeReparto,
    private readonly alFallar: (error: unknown) => void,
  ) {}

  /** Empieza un reparto o anota una vuelta más; la promesa termina cuando no queda nada pendiente. */
  disparar(): Promise<void> {
    if (this.enCurso) {
      this.otraVuelta = true;
      return this.enCurso;
    }
    this.enCurso = this.repartirMientrasHagaFalta().finally(() => {
      this.enCurso = null;
    });
    return this.enCurso;
  }

  private async repartirMientrasHagaFalta(): Promise<void> {
    do {
      this.otraVuelta = false;
      try {
        await this.vuelta.ejecutar();
      } catch (error) {
        this.alFallar(error);
      }
    } while (this.otraVuelta);
  }
}
