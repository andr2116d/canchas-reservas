import { IsOptional, IsString } from 'class-validator';
import type { CambiosDeMiCuenta } from '../../aplicacion/actualizar-mi-cuenta.use-case';
import { COMO_TEXTO } from './datos-personales.dto';

/** Cuerpo de `PATCH /api/cuenta`: solo los datos de contacto. */
export class ActualizarMiCuentaDto implements CambiosDeMiCuenta {
  @IsOptional()
  @IsString(COMO_TEXTO)
  correo?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  celular?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  dorsal?: string;
}

/** Cuerpo de `PATCH /api/cuenta/contrasena`. */
export class CambiarMiContrasenaDto {
  @IsString({ message: 'Ingresa la contraseña actual.' })
  actual: string;

  @IsString({ message: 'Ingresa la nueva contraseña.' })
  contrasena: string;
}
