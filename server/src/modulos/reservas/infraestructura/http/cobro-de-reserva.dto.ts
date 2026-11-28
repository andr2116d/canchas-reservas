import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  type CobroSolicitado,
  METODOS_DE_PAGO,
  type MetodoDePago,
} from '../../dominio/cobro-de-reserva';

export class CobroDeReservaDto implements CobroSolicitado {
  @IsOptional()
  @IsString({ message: 'Ingresa el monto en soles.' })
  @MaxLength(12, { message: 'Ingresa el monto en soles.' })
  monto?: string;

  @IsOptional()
  @IsIn(METODOS_DE_PAGO, { message: 'Elige efectivo, Yape o Plin.' })
  metodo?: MetodoDePago;

  @IsOptional()
  @IsString({ message: 'Ingresa el número de operación.' })
  @MaxLength(120, {
    message: 'El número de operación debe tener como máximo 120 caracteres.',
  })
  numeroOperacion?: string;
}
