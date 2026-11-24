import type { AccesoRepository } from '../dominio/acceso.repository';

const ACCESOS_RECIENTES = 10;

/** Los últimos inicios de sesión de la propia cuenta, para reconocer un acceso ajeno. */
export class ConsultarMisAccesosUseCase {
  constructor(
    private readonly accesos: Pick<AccesoRepository, 'ultimosAccesos'>,
  ) {}

  async ejecutar(usuarioId: number): Promise<{ ocurridoEn: string }[]> {
    const momentos = await this.accesos.ultimosAccesos(
      usuarioId,
      ACCESOS_RECIENTES,
    );
    return momentos.map((momento) => ({ ocurridoEn: momento.toISOString() }));
  }
}
