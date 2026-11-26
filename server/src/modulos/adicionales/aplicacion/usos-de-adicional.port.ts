export const USOS_DE_ADICIONAL = Symbol('USOS_DE_ADICIONAL');

/** Si un adicional alguna vez se entregó o se cobró en una reserva. */
export interface UsosDeAdicional {
  /** De los ids dados, los que ya se usaron. */
  conUsos(adicionalIds: number[]): Promise<Set<number>>;
}
