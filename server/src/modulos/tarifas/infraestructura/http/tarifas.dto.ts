import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DefinirHorarioDto } from '../../../horario/api-horario-http';
import { DIAS_DE_LA_SEMANA } from '../../../horario/api-horario';
import type { DatosDeTarifa } from '../../aplicacion/definir-tarifa.use-case';
import { TIPOS_DE_CANCHA } from '../../../../compartido/dominio/tipo-de-cancha';

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

/** Tarifa en edición de un tipo de cancha, para simular sus turnos. */
class TarifaSimuladaDto extends DefinirTarifaDto {
  @IsIn(TIPOS_DE_CANCHA, { message: 'Elige fútbol 5 o fútbol 7.' })
  tipo: string;
}

/** Cuerpo de `POST /api/tarifas/simulacion`: el horario y las tarifas tal como se están editando. */
export class SimularTurnosDto {
  @ValidateNested()
  @Type(() => DefinirHorarioDto)
  horario: DefinirHorarioDto;

  @IsArray({ message: 'Indica las tarifas a simular.' })
  @ArrayMaxSize(TIPOS_DE_CANCHA.length, {
    message: 'Indica una tarifa por tipo de cancha.',
  })
  @ValidateNested({ each: true })
  @Type(() => TarifaSimuladaDto)
  tarifas: TarifaSimuladaDto[];
}
