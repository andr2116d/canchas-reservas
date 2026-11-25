import { IsOptional, IsString } from 'class-validator';
import type { DatosDelFiltroDeHojas } from '../../dominio/filtro-de-hojas';
import type { DatosDeLaRespuesta } from '../../dominio/respuesta-de-la-hoja';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/** Consulta de `GET /api/reclamos`: todos los filtros son opcionales. */
export class FiltroDeHojasDto implements DatosDelFiltroDeHojas {
  @IsOptional() @IsString(COMO_TEXTO) estado?: string;
  @IsOptional() @IsString(COMO_TEXTO) tipo?: string;
  @IsOptional() @IsString(COMO_TEXTO) motivo?: string;
  @IsOptional() @IsString(COMO_TEXTO) numero?: string;
  @IsOptional() @IsString(COMO_TEXTO) desde?: string;
  @IsOptional() @IsString(COMO_TEXTO) hasta?: string;
  @IsOptional() @IsString(COMO_TEXTO) orden?: string;
  @IsOptional() @IsString(COMO_TEXTO) pagina?: string;
  @IsOptional() @IsString(COMO_TEXTO) porPagina?: string;
}

export class ClasificacionDto {
  @IsString(COMO_TEXTO) motivo: string;
}

export class RespuestaDto implements DatosDeLaRespuesta {
  @IsString(COMO_TEXTO) texto: string;
  @IsOptional() @IsString(COMO_TEXTO) cartaEnviadaEl?: string;
}
