import { IsIn, IsString } from 'class-validator';
import type { DatosDeTarifa } from '../../aplicacion/definir-tarifa.use-case';
import { TIPOS_DE_CANCHA } from '../../dominio/tipo-de-cancha';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/** Cuerpo de `PUT /api/tarifas/:tipo`; las reglas de cada dato las valida el dominio. */
export class DefinirTarifaDto implements DatosDeTarifa {
  @IsString(COMO_TEXTO)
  precioDia: string;

  @IsString(COMO_TEXTO)
  precioNoche: string;

  @IsString(COMO_TEXTO)
  duracionDelTurno: string;
}

/** Consulta de `GET /api/tarifas/valor-del-turno`. */
export class ValorDelTurnoDto {
  @IsIn(TIPOS_DE_CANCHA, { message: 'Elige fútbol 5 o fútbol 7.' })
  tipo: string;

  @IsString(COMO_TEXTO)
  inicio: string;
}
