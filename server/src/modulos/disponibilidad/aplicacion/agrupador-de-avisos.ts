/**
 * Junta los cambios que llegan seguidos (por ejemplo, un alta de varias canchas)
 * y avisa una sola vez, al terminar la espera desde el primero.
 */
export class AgrupadorDeAvisos {
  private pendiente?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly esperaMs: number,
    private readonly avisar: () => void,
  ) {}

  recibir(): void {
    if (this.pendiente) return;
    this.pendiente = setTimeout(() => {
      this.pendiente = undefined;
      this.avisar();
    }, this.esperaMs);
  }

  detener(): void {
    clearTimeout(this.pendiente);
    this.pendiente = undefined;
  }
}
