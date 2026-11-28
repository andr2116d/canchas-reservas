import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import {
  type CobroSolicitado,
  validarCobro,
} from '../dominio/cobro-de-reserva';
import { CodigoRepetidoError } from '../dominio/codigo-repetido.error';
import { MontosCambiaronError } from '../dominio/montos-cambiaron.error';
import {
  finDeLaRetencion,
  MAXIMO_DE_PENDIENTES_DE_PAGO,
} from '../dominio/reglas-de-la-reserva';
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

export type PedidoDeRecepcion = Omit<PedidoDeReserva, 'adicionales'> & {
  cobro?: CobroSolicitado;
};

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
  pedido: Pick<PedidoDeReserva, 'precio' | 'adelanto'>,
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
    const reserva = await this.preparar(pedido);
    const codigo = await this.guardar({
      ...reserva,
      creadaPorId: pedido.titularId,
      canal: 'WEB',
      adicionalIds: await this.adicionalesActivos(pedido.adicionales),
    });
    await this.de.avisos.nuevaReserva(codigo);
    return { codigo, estado: 'PENDIENTE_DE_PAGO', venceEn: reserva.venceEn };
  }

  async desdeRecepcion(pedido: PedidoDeRecepcion, creadaPorId: number) {
    const reserva = await this.preparar(pedido);
    const cobro = pedido.cobro
      ? validarCobro(pedido.cobro, (monto) => {
          if (monto.centimos < reserva.adelanto.centimos) {
            throw new ValorInvalidoError(
              `El adelanto mínimo es S/ ${reserva.adelanto.enSoles()}.`,
            );
          }
          if (monto.centimos > reserva.precio.centimos) {
            throw new ValorInvalidoError(
              `El monto no puede superar el precio total de S/ ${reserva.precio.enSoles()}.`,
            );
          }
        })
      : undefined;
    const venceEn = cobro ? null : reserva.venceEn;
    const codigo = await this.guardar({
      ...reserva,
      venceEn,
      cobro,
      creadaPorId,
      canal: 'RECEPCION',
      adicionalIds: [],
    });
    await this.de.avisos.nuevaReserva(codigo);
    return {
      codigo,
      estado: cobro ? ('CONFIRMADA' as const) : ('PENDIENTE_DE_PAGO' as const),
      venceEn,
    };
  }

  private async preparar(pedido: Omit<PedidoDeReserva, 'adicionales'>) {
    const ahora = this.de.reloj.ahora();
    await exigirTitularHabilitado(this.de.titulares, pedido.titularId, ahora);
    const elegido = await turnoParaReservar(this.de, pedido);
    exigirMismosMontos(pedido, elegido);
    const { turno, regla } = elegido;
    const venceEn = finDeLaRetencion(ahora, turno.inicio);
    return {
      canchaId: turno.cancha.id,
      titularId: pedido.titularId,
      inicio: turno.inicio,
      fin: turno.fin,
      precio: Monto.crear(turno.precio),
      porcentajeDeAdelanto: turno.adelanto.porcentaje,
      adelanto: Monto.crear(turno.adelanto.monto),
      reglaDeCancelacionId: regla.id,
      creadaEn: ahora,
      venceEn,
    };
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

  private async guardar(datos: Omit<ReservaNueva, 'codigo'>): Promise<string> {
    for (let intento = 1; ; intento++) {
      const codigo = this.de.codigos.nuevo();
      try {
        await this.de.reservas.crear(
          { ...datos, codigo },
          MAXIMO_DE_PENDIENTES_DE_PAGO,
        );
        return codigo;
      } catch (error) {
        const repetido = error instanceof CodigoRepetidoError;
        if (!repetido || intento >= INTENTOS_DE_CODIGO) throw error;
      }
    }
  }
}
