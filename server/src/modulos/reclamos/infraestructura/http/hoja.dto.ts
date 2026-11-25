import { IsBoolean, IsOptional, IsString } from 'class-validator';
import type { DatosDeLaHoja } from '../../dominio/hoja-de-reclamacion.entity';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

/** Cuerpo de `POST /api/libro-de-reclamaciones`: solo los campos del formato oficial. */
export class HojaDto implements DatosDeLaHoja {
  @IsString(COMO_TEXTO) tipoDocumento: string;
  @IsString(COMO_TEXTO) numeroDocumento: string;
  @IsString(COMO_TEXTO) nombres: string;
  @IsString(COMO_TEXTO) apellidos: string;
  @IsString(COMO_TEXTO) domicilio: string;
  @IsString(COMO_TEXTO) telefono: string;
  @IsString(COMO_TEXTO) correo: string;

  @IsBoolean({ message: 'Indica si quien reclama es menor de edad.' })
  esMenorDeEdad: boolean;

  @IsOptional() @IsString(COMO_TEXTO) representanteNombre?: string;
  @IsOptional() @IsString(COMO_TEXTO) representanteDomicilio?: string;
  @IsOptional() @IsString(COMO_TEXTO) representanteTelefono?: string;
  @IsOptional() @IsString(COMO_TEXTO) representanteCorreo?: string;

  @IsString(COMO_TEXTO) servicio: string;
  @IsOptional() @IsString(COMO_TEXTO) montoReclamado?: string;
  @IsOptional() @IsString(COMO_TEXTO) descripcionDelServicio?: string;
  @IsString(COMO_TEXTO) tipo: string;
  @IsString(COMO_TEXTO) detalle: string;
  @IsString(COMO_TEXTO) pedido: string;
  @IsString(COMO_TEXTO) medioDeRespuesta: string;
}
