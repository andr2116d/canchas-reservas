import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { DuracionDelTurno } from '../dominio/duracion-del-turno.value-object';
import { Monto } from '../dominio/monto.value-object';
import { Tarifa } from '../dominio/tarifa';
import type { TarifaRepository } from '../dominio/tarifa.repository';
import { exigirTipoDeCancha } from './tipo-pedido';
import { aVista, type VistaDeTarifa } from './vista-de-tarifa';

/** Datos tal como los escribe el administrador. */
export interface DatosDeTarifa {
  precioDia: string;
  precioNoche: string;
  duracionDelTurno: string;
  ofreceTurnoCorto: boolean;
}

/**
 * Define la tarifa de un tipo de cancha. Rige desde que se guarda: las reservas
 * hechas antes conservan su precio. Guardar los mismos valores no es un cambio.
 */
export class DefinirTarifaUseCase {
  constructor(
    private readonly tarifas: Pick<TarifaRepository, 'guardarSiCambia'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    tipoPedido: string,
    datos: DatosDeTarifa,
    administradorId: number,
  ): Promise<{ cambio: boolean; vigente: VistaDeTarifa }> {
    const tipo = exigirTipoDeCancha(tipoPedido);
    const campos = validarCampos({
      precioDia: () => Monto.crear(datos.precioDia),
      precioNoche: () => Monto.crear(datos.precioNoche),
      duracionDelTurno: () => DuracionDelTurno.crear(datos.duracionDelTurno),
    });
    const tarifa = new Tarifa({
      tipo,
      precioDia: campos.precioDia,
      precioNoche: campos.precioNoche,
      duracion: campos.duracionDelTurno,
      ofreceTurnoCorto: datos.ofreceTurnoCorto,
    });
    const { cambio, version } = await this.tarifas.guardarSiCambia(
      tarifa,
      administradorId,
      this.reloj.ahora(),
    );
    return { cambio, vigente: aVista(version) };
  }
}
