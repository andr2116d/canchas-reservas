import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAXIMO_ID } from '../../../../compartido/dominio/id';

const CANCHA = { message: 'Elige una cancha del mapa.' };
const FECHA = { message: 'Elige una fecha del mapa.' };
const HORA = { message: 'Elige un turno del mapa.' };
const MONTO = { message: 'Ingresa el monto en soles.' };
const MATERIAL = { message: 'Elige el material de la lista.' };

/** Consulta de `GET /api/reservas/resumen`: el turno tal como se eligió en el mapa. */
export class ResumenDeReservaDto {
  @IsString(CANCHA)
  @Matches(/^\d{1,10}$/, CANCHA)
  canchaId: string;

  @IsString(FECHA)
  @MaxLength(10, FECHA)
  fecha: string;

  @IsString(HORA)
  @MaxLength(5, HORA)
  desde: string;
}

/** Cuerpo de `POST /api/reservas`: el turno, los montos que se mostraron y el material pedido. */
export class SepararTurnoDto {
  @IsInt(CANCHA)
  @Min(1, CANCHA)
  @Max(MAXIMO_ID, CANCHA)
  canchaId: number;

  @IsString(FECHA)
  @MaxLength(10, FECHA)
  fecha: string;

  @IsString(HORA)
  @MaxLength(5, HORA)
  desde: string;

  @IsString(MONTO)
  @MaxLength(12, MONTO)
  precio: string;

  @IsString(MONTO)
  @MaxLength(12, MONTO)
  adelanto: string;

  @IsArray(MATERIAL)
  @ArrayMaxSize(20, MATERIAL)
  @IsInt({ each: true, ...MATERIAL })
  @Min(1, { each: true, ...MATERIAL })
  @Max(MAXIMO_ID, { each: true, ...MATERIAL })
  adicionales: number[];
}
