import type { RolUsuario } from '../../../src/compartido/dominio/rol-usuario';
import type {
  Aviso,
  AvisoNuevo,
  AvisoRepository,
} from '../../../src/modulos/avisos/dominio/aviso';

/** Avisos en memoria; recibe qué cuentas tiene cada rol. */
export class EnMemoriaAvisoRepository implements AvisoRepository {
  readonly avisos: (Aviso & { usuarioId: number })[] = [];

  constructor(
    private readonly cuentasPorRol: Partial<Record<RolUsuario, number[]>> = {},
  ) {}

  async crearParaRol(rol: RolUsuario, aviso: AvisoNuevo): Promise<void> {
    for (const usuarioId of this.cuentasPorRol[rol] ?? [])
      await this.crearPara(usuarioId, aviso);
  }

  crearPara(usuarioId: number, aviso: AvisoNuevo): Promise<void> {
    this.avisos.push({
      ...aviso,
      id: this.avisos.length + 1,
      usuarioId,
      leidoEn: null,
    });
    return Promise.resolve();
  }

  recientes(usuarioId: number, limite: number): Promise<Aviso[]> {
    return Promise.resolve(
      this.avisos
        .filter((a) => a.usuarioId === usuarioId)
        .sort(
          (a, b) => b.creadoEn.getTime() - a.creadoEn.getTime() || b.id - a.id,
        )
        .slice(0, limite)
        .map(({ usuarioId: _, ...aviso }) => aviso),
    );
  }

  sinLeer(usuarioId: number): Promise<number> {
    return Promise.resolve(
      this.avisos.filter((a) => a.usuarioId === usuarioId && !a.leidoEn).length,
    );
  }

  marcarLeido(
    usuarioId: number,
    avisoId: number,
    momento: Date,
  ): Promise<boolean> {
    const aviso = this.avisos.find(
      (a) => a.id === avisoId && a.usuarioId === usuarioId,
    );
    if (aviso) aviso.leidoEn ??= momento;
    return Promise.resolve(Boolean(aviso));
  }

  marcarTodosLeidos(usuarioId: number, momento: Date): Promise<void> {
    for (const a of this.avisos)
      if (a.usuarioId === usuarioId) a.leidoEn ??= momento;
    return Promise.resolve();
  }
}
