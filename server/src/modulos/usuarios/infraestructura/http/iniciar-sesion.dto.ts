import { IsString, Length } from 'class-validator';
import type { DatosInicioSesion } from '../../aplicacion/iniciar-sesion.use-case';

const MENSAJE = { message: 'Correo o contraseña incorrectos.' };

export class IniciarSesionDto implements DatosInicioSesion {
  @IsString(MENSAJE)
  @Length(1, 254, MENSAJE)
  correo: string;

  @IsString(MENSAJE)
  @Length(1, 64, MENSAJE)
  contrasena: string;
}

export class CambiarContrasenaTemporalDto {
  @IsString({ message: 'Ingresa la nueva contraseña.' })
  @Length(1, 64, {
    message: 'La contraseña no puede tener más de 64 caracteres.',
  })
  contrasena: string;
}
