import { IsBoolean } from 'class-validator';
import { TurnoReservaDto } from './turno-reserva.dto';

export class CrearReservaDto extends TurnoReservaDto {
  @IsBoolean({ message: 'Indica si quieres usar tu crédito' })
  usarCredito!: boolean;
}
