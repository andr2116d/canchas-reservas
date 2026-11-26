import { IsBoolean, IsOptional, IsString } from 'class-validator';
import type { CambiosDeMiCuenta } from '../../aplicacion/actualizar-mi-cuenta.use-case';
import type { CambioDeTipoDeDocumento } from '../../aplicacion/cambiar-mi-tipo-de-documento.use-case';
import type { DatosParaConfirmar } from '../../aplicacion/completar-mis-datos.use-case';
import { COMO_TEXTO } from './datos-personales.dto';

/** Cuerpo de `PATCH /api/cuenta`: los datos que el rol puede cambiar; el dominio dice cuáles. */
export class ActualizarMiCuentaDto implements CambiosDeMiCuenta {
  @IsOptional()
  @IsString(COMO_TEXTO)
  nombres?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  apellidos?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  fechaNacimiento?: string;

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

/** Cuerpo de `POST /api/cuenta/datos`: el primer ingreso del personal. */
export class CompletarMisDatosDto implements DatosParaConfirmar {
  @IsString(COMO_TEXTO)
  nombres: string;

  @IsString(COMO_TEXTO)
  apellidos: string;

  @IsString(COMO_TEXTO)
  fechaNacimiento: string;

  @IsString(COMO_TEXTO)
  celular: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  tipoDocumento?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  numeroDocumento?: string;
}

/** Cuerpo de `PATCH /api/cuenta/documento`: el cambio único de tipo de documento. */
export class CambiarMiTipoDeDocumentoDto implements CambioDeTipoDeDocumento {
  @IsString({ message: 'Elige el tipo de documento.' })
  tipoDocumento: string;

  @IsString(COMO_TEXTO)
  numeroDocumento: string;

  @IsBoolean({
    message:
      'Confirma que leíste el aviso antes de cambiar el tipo de documento.',
  })
  aceptaAviso: boolean;
}
