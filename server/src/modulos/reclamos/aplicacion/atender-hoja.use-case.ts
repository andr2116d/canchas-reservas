import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { HojaRepository } from '../dominio/hoja.repository';
import { buscarHoja } from './buscar-hoja';

/** Las acciones de administración que no responden: comparten la hoja y el reloj. */
abstract class AccionSobreHoja {
  constructor(
    protected readonly hojas: HojaRepository,
    protected readonly reloj: Reloj,
  ) {}

  protected autoria(administradorId: number) {
    return { ejecutadoPorId: administradorId, ocurridoEn: this.reloj.ahora() };
  }
}

/** La primera vez que administración abre una hoja, pasa a «en atención» y queda registrado. */
export class AbrirHojaUseCase extends AccionSobreHoja {
  async ejecutar(numero: string, administradorId: number): Promise<void> {
    const hoja = await buscarHoja(this.hojas, numero);
    await this.hojas.registrarApertura(hoja, this.autoria(administradorId));
  }
}

/** Pone el motivo interno; el mismo motivo otra vez no deja registro. */
export class ClasificarHojaUseCase extends AccionSobreHoja {
  async ejecutar(
    numero: string,
    motivo: string,
    administradorId: number,
  ): Promise<void> {
    const hoja = await buscarHoja(this.hojas, numero);
    const cambio = hoja.clasificar(motivo);
    if (!cambio) return;
    await this.hojas.guardar(hoja, {
      accion: 'CLASIFICACION',
      detalle: { ...cambio },
      ...this.autoria(administradorId),
    });
  }
}

/** Tramita como reclamo una queja que describe un problema con el servicio. */
export class TramitarComoReclamoUseCase extends AccionSobreHoja {
  async ejecutar(numero: string, administradorId: number): Promise<void> {
    const hoja = await buscarHoja(this.hojas, numero);
    hoja.tramitarComoReclamo();
    await this.hojas.guardar(hoja, {
      accion: 'CAMBIO_DE_TIPO',
      detalle: { antes: 'QUEJA', despues: 'RECLAMO' },
      ...this.autoria(administradorId),
    });
  }
}
