import type { TipoDocumento } from '../../../generated/prisma/enums';
import {
  CampoApellidos,
  CampoContrasena,
  CampoCorreo,
  CampoNombres,
  CampoNumeroDocumento,
  CampoTelefono,
  CampoTipoDocumento,
} from './campos-usuario';

export class RegistrarJugadorDto {
  @CampoNombres()
  nombres!: string;

  @CampoApellidos()
  apellidos!: string;

  @CampoTipoDocumento()
  tipoDocumento!: TipoDocumento;

  @CampoNumeroDocumento()
  numeroDocumento!: string;

  @CampoCorreo()
  correo!: string;

  @CampoTelefono()
  telefono!: string;

  @CampoContrasena()
  contrasena!: string;
}
