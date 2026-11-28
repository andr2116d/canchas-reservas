import { Monto } from '../../../compartido/dominio/monto.value-object';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

export const METODOS_DE_PAGO = ['EFECTIVO', 'YAPE', 'PLIN'] as const;
export type MetodoDePago = (typeof METODOS_DE_PAGO)[number];

export interface CobroSolicitado {
  monto?: string;
  metodo?: MetodoDePago;
  numeroOperacion?: string;
}

export interface CobroDeReserva {
  monto: Monto;
  metodo: MetodoDePago;
  numeroOperacion: string | null;
}

export function validarCobro(
  datos: CobroSolicitado,
  exigirMonto: (monto: Monto) => void,
): CobroDeReserva {
  return validarCampos({
    monto: () => {
      const monto = Monto.crear(datos.monto ?? '');
      exigirMonto(monto);
      return monto;
    },
    metodo: () => {
      if (!datos.metodo)
        throw new ValorInvalidoError('Elige el método de pago.');
      return datos.metodo;
    },
    numeroOperacion: () => {
      if (!datos.metodo || datos.metodo === 'EFECTIVO') return null;
      const numero = datos.numeroOperacion?.trim();
      if (!numero)
        throw new ValorInvalidoError('Ingresa el número de operación.');
      return numero.toUpperCase();
    },
  });
}
