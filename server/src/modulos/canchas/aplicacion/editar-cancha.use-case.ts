import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import type {
  CambiosDeCancha,
  Cancha,
  DatosDeCancha,
} from '../dominio/cancha.entity';
import type { CanchaRepository } from '../dominio/cancha.repository';
import {
  buscarCancha,
  exigirSinReservasPorJugar,
  nombreOcupado,
} from './comprobaciones-de-cancha';
import type { ReservasDeCancha } from './reservas-de-cancha.port';
import { aVista, type VistaDeCancha } from './vista-de-cancha';

/** Cambiar el tamaño o quitar la luz altera lo que se reservó. */
function afectaReservas(cambios: CambiosDeCancha): boolean {
  return (
    cambios.tipo !== undefined || cambios.tieneIluminacion?.despues === false
  );
}

/**
 * Edita los datos de una cancha y deja en la auditoría el valor anterior y el
 * nuevo de lo que cambió. Con reservas por jugar no cambia su tamaño ni le quita la luz.
 */
export class EditarCanchaUseCase {
  constructor(
    private readonly canchas: Pick<
      CanchaRepository,
      'buscar' | 'nombresOcupados' | 'guardar'
    >,
    private readonly reservas: ReservasDeCancha,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    id: number,
    datos: DatosDeCancha,
    administradorId: number,
  ): Promise<VistaDeCancha> {
    const cancha = await buscarCancha(this.canchas, id);
    const cambios = cancha.editar(datos);
    if (Object.keys(cambios).length > 0) {
      const ahora = this.reloj.ahora();
      await this.comprobar(cancha, cambios, ahora);
      await this.canchas.guardar(cancha, {
        accion: 'EDICION',
        detalle: cambios,
        ejecutadoPorId: administradorId,
        ocurridoEn: ahora,
      });
    }
    const conReservas = await this.reservas.conReservas([id]);
    return aVista(cancha, !conReservas.has(id));
  }

  private async comprobar(
    cancha: Cancha,
    cambios: CambiosDeCancha,
    ahora: Date,
  ): Promise<void> {
    if (cambios.nombre) {
      const ocupados = await this.canchas.nombresOcupados(
        [cancha.nombreNormalizado],
        cancha.id,
      );
      if (ocupados.length > 0)
        throw new ConflictoError('El nombre ya lo usa otra cancha.', {
          nombre: nombreOcupado(cancha.ficha.nombre),
        });
    }
    if (afectaReservas(cambios))
      await exigirSinReservasPorJugar({
        reservas: this.reservas,
        canchaId: cancha.id!,
        desde: ahora,
        mensaje:
          'No se puede cambiar el tamaño ni quitar la iluminación: la cancha tiene reservas por jugar.',
      });
  }
}
