import { IsOptional, IsString } from 'class-validator';
import type { DatosDeLaAgenda } from '../../dominio/filtro-de-la-agenda';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/** Consulta de `GET /api/agenda`: todos los filtros son opcionales y los valida el dominio. */
export class ConsultarAgendaDto implements DatosDeLaAgenda {
  @IsOptional() @IsString(COMO_TEXTO) fecha?: string;
  @IsOptional() @IsString(COMO_TEXTO) canchaId?: string;
  @IsOptional() @IsString(COMO_TEXTO) estado?: string;
}
