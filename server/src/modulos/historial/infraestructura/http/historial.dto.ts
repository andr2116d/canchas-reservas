import { IsOptional, IsString } from 'class-validator';
import type { DatosDelFiltro } from '../../dominio/filtro-del-historial';

const COMO_TEXTO = { message: 'Ingresa este filtro como texto.' };

/** Filtros de `GET /api/historial`; las reglas de cada uno las valida el dominio. */
export class FiltroDelHistorialDto implements DatosDelFiltro {
  @IsOptional() @IsString(COMO_TEXTO) autor?: string;
  @IsOptional() @IsString(COMO_TEXTO) categoria?: string;
  @IsOptional() @IsString(COMO_TEXTO) accion?: string;
  @IsOptional() @IsString(COMO_TEXTO) desde?: string;
  @IsOptional() @IsString(COMO_TEXTO) hasta?: string;
  @IsOptional() @IsString(COMO_TEXTO) soloImportantes?: string;
  @IsOptional() @IsString(COMO_TEXTO) orden?: string;
  @IsOptional() @IsString(COMO_TEXTO) pagina?: string;
  @IsOptional() @IsString(COMO_TEXTO) porPagina?: string;
}
