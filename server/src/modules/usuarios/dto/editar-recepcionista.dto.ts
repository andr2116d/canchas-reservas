import {
  CampoApellidos,
  CampoCorreo,
  CampoNombres,
  CampoTelefono,
  SoloSiViene,
} from './campos-usuario';

export class EditarRecepcionistaDto {
  @SoloSiViene()
  @CampoNombres()
  nombres?: string;

  @SoloSiViene()
  @CampoApellidos()
  apellidos?: string;

  @SoloSiViene()
  @CampoTelefono()
  telefono?: string;

  @SoloSiViene()
  @CampoCorreo()
  correo?: string;
}
