import {
  type ErroresPorCampo,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import {
  calcularCompensacion,
  type Compensacion,
} from '../dominio/compensacion';
import {
  type DatosDelRango,
  ReglaDeCancelacion,
} from '../dominio/regla-de-cancelacion';

export interface DatosDeLaSimulacion {
  rangos: DatosDelRango[];
  anticipo: string;
  pagado: string;
  minutosDeAnticipacion: number;
}

/** Construye la regla en edición y los montos, y reúne los errores de todos. */
function leer(datos: DatosDeLaSimulacion) {
  const errores: ErroresPorCampo = {};
  let regla: ReglaDeCancelacion | undefined;
  try {
    regla = ReglaDeCancelacion.crear(datos.rangos);
  } catch (error) {
    if (!(error instanceof ReglaInvalidaError)) throw error;
    Object.assign(errores, error.errores);
  }
  let montos: { anticipo: Monto; pagado: Monto } | undefined;
  try {
    montos = validarCampos({
      anticipo: () => Monto.crear(datos.anticipo),
      pagado: () => Monto.crear(datos.pagado),
    });
  } catch (error) {
    if (!(error instanceof ReglaInvalidaError)) throw error;
    Object.assign(errores, error.errores);
  }
  if (!regla || !montos) throw new ReglaInvalidaError(errores);
  return { regla, ...montos };
}

/**
 * Lo que recibiría el jugador con la regla en edición, sin guardar nada: el mismo
 * cálculo que se aplicará al cancelar una reserva.
 */
export class SimularCancelacionUseCase {
  async ejecutar(datos: DatosDeLaSimulacion): Promise<Compensacion> {
    const { regla, anticipo, pagado } = leer(datos);
    try {
      return calcularCompensacion(regla, {
        anticipo,
        pagado,
        minutosDeAnticipacion: datos.minutosDeAnticipacion,
      });
    } catch (error) {
      if (!(error instanceof ValorInvalidoError)) throw error;
      const campo =
        datos.minutosDeAnticipacion < 0 ? 'minutosDeAnticipacion' : 'pagado';
      throw new ReglaInvalidaError({ [campo]: error.message });
    }
  }
}
