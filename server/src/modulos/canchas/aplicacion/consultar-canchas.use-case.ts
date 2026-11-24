import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { TipoDeBloqueo } from '../dominio/bloqueo.entity';
import type { BloqueoRepository } from '../dominio/bloqueo.repository';
import type { CanchaRepository } from '../dominio/cancha.repository';
import type { ReservasDeCancha } from './reservas-de-cancha.port';
import {
  aVista,
  aVistaDeCambio,
  type VistaDeCambio,
  type VistaDeCancha,
} from './vista-de-cancha';

const CAMBIOS_RECIENTES = 30;

/** Una cancha en la lista, con su mantenimiento en curso y el próximo, si los hay. */
export interface CanchaEnLaLista extends VistaDeCancha {
  mantenimiento: { hasta: string; tipo: TipoDeBloqueo } | null;
  proximoMantenimiento: { inicio: string; fin: string } | null;
}

export interface DependenciasDeLaConsulta {
  canchas: Pick<CanchaRepository, 'listar' | 'cambios'>;
  reservas: Pick<ReservasDeCancha, 'conReservas'>;
  bloqueos: Pick<BloqueoRepository, 'sinTerminar'>;
  reloj: Reloj;
}

/** Las canchas del local con su estado de mantenimiento, y los cambios recientes, para administración. */
export class ConsultarCanchasUseCase {
  constructor(private readonly dependencias: DependenciasDeLaConsulta) {}

  async listar(): Promise<CanchaEnLaLista[]> {
    const { canchas, reservas, bloqueos, reloj } = this.dependencias;
    const ahora = reloj.ahora();
    const lista = await canchas.listar();
    const [conReservas, sinTerminar] = await Promise.all([
      reservas.conReservas(lista.map((cancha) => cancha.id!)),
      bloqueos.sinTerminar(ahora),
    ]);
    return lista.map((cancha) => {
      const suyos = sinTerminar
        .map((b) => b.bloqueo)
        .filter((b) => b.ficha.canchaId === cancha.id);
      const enCurso = suyos.find((b) => b.etapa(ahora) === 'EN_CURSO');
      const proximo = suyos.find((b) => b.etapa(ahora) === 'PROXIMO');
      return {
        ...aVista(cancha, !conReservas.has(cancha.id!)),
        mantenimiento: enCurso
          ? {
              hasta: enCurso.finEfectivo.toISOString(),
              tipo: enCurso.ficha.tipo,
            }
          : null,
        proximoMantenimiento: proximo
          ? {
              inicio: proximo.ficha.inicio.toISOString(),
              fin: proximo.finEfectivo.toISOString(),
            }
          : null,
      };
    });
  }

  async cambios(): Promise<VistaDeCambio[]> {
    return (await this.dependencias.canchas.cambios(CAMBIOS_RECIENTES)).map(
      aVistaDeCambio,
    );
  }
}
