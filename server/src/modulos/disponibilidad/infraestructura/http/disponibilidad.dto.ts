import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Consulta de `GET /api/disponibilidad`; el rango de fechas lo valida la aplicación. */
export class ConsultarDisponibilidadDto {
  @IsOptional()
  @IsString({ message: 'Ingresa una fecha válida.' })
  @MaxLength(10, { message: 'Ingresa una fecha válida.' })
  fecha?: string;
}
