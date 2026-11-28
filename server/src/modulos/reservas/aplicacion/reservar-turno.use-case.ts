import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { CodigoRepetidoError } from '../dominio/codigo-repetido.error';
import { MontosCambiaronError } from '../dominio/montos-cambiaron.error';
import { MAXIMO_DE_PENDIENTES_DE_PAGO } from '../dominio/reglas-de-la-reserva';
import type {
  ReservaNueva,
  ReservaRepository,
} from '../dominio/reserva.repository';
import type { AvisosDeReserva } from './avisos-de-reserva.port';
import type { CatalogoDeAdicionales } from './catalogo-de-adicionales.port';
import type { GeneradorDeCodigo } from './generador-de-codigo.port';
import { exigirTitularHabilitado } from './titular-habilitado';
import type { Titulares } from './titulares.port';
import {
  type DependenciasDelTurno,
  type TurnoParaReservar,
  turnoParaReservar,
} from './turno-para-reservar';
import type { TurnoPedido } from './turnos-del-local.port';

const INTENTOS_DE_CODIGO = 3;

/** El turno elegido, los montos que se mostraron y el material que se pide tener listo. */
export interface PedidoDeReserva extends TurnoPedido {
  titularId: number;
  precio: string;
  adelanto: string;
  adicionales: number[];
}

export interface ReservaSeparada {
  codigo: string;
  estado: 'PENDIENTE_DE_PAGO';
  venceEn: Date;
}

export interface DependenciasDeLaReserva extends DependenciasDelTurno {
  catalogo: CatalogoDeAdicionales;
  titulares: Titulares;
  reservas: ReservaRepository;
  codigos: GeneradorDeCodigo;
  avisos: AvisosDeReserva;
  reloj: Reloj;
}

/** Los montos que vio la persona deben ser los vigentes: el precio no cambia al confirmar. */
function exigirMismosMontos(
  pedido: PedidoDeReserva,
  { turno }: TurnoParaReservar,
): void {
  const vistos = validarCampos({
    precio: () => Monto.crear(pedido.precio),
    adelanto: () => Monto.crear(pedido.adelanto),
  });
  const precio = Monto.crear(turno.precio);
  const adelanto = Monto.crear(turno.adelanto.monto);
  if (
    vistos.precio.centimos !== precio.centimos ||
    vistos.adelanto.centimos !== adelanto.centimos
  ) {
    throw new MontosCambiaronError({
      precio: precio.enSoles(),
      adelanto: adelanto.enSoles(),
    });
  }
}

/**
 * Separa un turno libre para su titular: queda pendiente de pago, con los montos y la
 * regla de cancelación de este momento, retiene el turno hasta que vence y avisa al personal.
 */
export class ReservarTurnoUseCase {
  constructor(private readonly de: DependenciasDeLaReserva) {}

  async ejecutar(pedido: PedidoDeReserva): Promise<ReservaSeparada> {
    const ahora = this.de.reloj.ahora();
    await exigirTitularHabilitado(this.de.titulares, pedido.titularId, ahora);
    const elegido = await turnoParaReservar(this.de, pedido);
    exigirMismosMontos(pedido, elegido);
    const { turno, regla, plazo } = elegido;
    const venceEn = plazo.vencimiento(ahora, turno.inicio);
    const { codigo, expiradas } = await this.guardar({
      canchaId: turno.cancha.id,
      titularId: pedido.titularId,
      creadaPorId: pedido.titularId,
      inicio: turno.inicio,
      fin: turno.fin,
      precio: Monto.crear(turno.precio),
      porcentajeDeAdelanto: turno.adelanto.porcentaje,
      adelanto: Monto.crear(turno.adelanto.monto),
      reglaDeCancelacionId: regla.id,
      canal: 'WEB',
      creadaEn: ahora,
      venceEn,
      adicionalIds: await this.adicionalesActivos(pedido.adicionales),
    });
    await Promise.all([
      this.de.avisos.nuevaReserva(codigo),
      ...expiradas.map((vencida) =>
        this.de.avisos.reservaVencida(vencida.codigo, vencida.titularId),
      ),
    ]);
    return { codigo, estado: 'PENDIENTE_DE_PAGO', venceEn };
  }

  /** Los pedidos sin repetir y en el orden del catálogo; uno inactivo o inexistente se rechaza. */
  private async adicionalesActivos(pedidos: number[]): Promise<number[]> {
    const activos = await this.de.catalogo.activos();
    if (pedidos.some((id) => !activos.some((activo) => activo.id === id))) {
      throw new ConflictoError(
        'Uno de los materiales ya no está disponible. Revisa la lista.',
        {},
      );
    }
    return activos
      .filter((activo) => pedidos.includes(activo.id))
      .map((activo) => activo.id);
  }

  /** Guarda con un código nuevo; devuelve el código y las reservas vencidas que expiró. */
  private async guardar(datos: Omit<ReservaNueva, 'codigo'>) {
    for (let intento = 1; ; intento++) {
      const codigo = this.de.codigos.nuevo();
      try {
        const expiradas = await this.de.reservas.crear(
          { ...datos, codigo },
          MAXIMO_DE_PENDIENTES_DE_PAGO,
        );
        return { codigo, expiradas };
      } catch (error) {
        const repetido = error instanceof CodigoRepetidoError;
        if (!repetido || intento >= INTENTOS_DE_CODIGO) throw error;
      }
    }
  }
}
