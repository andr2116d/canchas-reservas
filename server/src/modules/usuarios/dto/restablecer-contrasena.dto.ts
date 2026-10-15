import { CampoContrasena } from './campos-usuario';

export class RestablecerContrasenaDto {
  @CampoContrasena()
  contrasena!: string;
}
