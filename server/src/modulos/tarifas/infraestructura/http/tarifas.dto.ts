import { IsBoolean, IsIn, IsString } from 'class-validator';
import { DIAS_DE_LA_SEMANA } from '../../../horario/api-horario';
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

  @IsBoolean({ message: 'Indica si se ofrece el turno corto.' })
  ofreceTurnoCorto: boolean;
}

/** Consulta de `GET /api/tarifas/turnos`. */
export class TurnosDelDiaDto {
  @IsIn(TIPOS_DE_CANCHA, { message: 'Elige fútbol 5 o fútbol 7.' })
  tipo: string;

  @IsIn(DIAS_DE_LA_SEMANA, { message: 'Elige un día de la semana.' })
  dia: string;
}
