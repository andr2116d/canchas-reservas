import { ValidateIf } from 'class-validator';
import { CampoNombre, CampoPrecio } from './crear-adicional.dto';

const SoloSiViene = () =>
  ValidateIf((_objeto, valor: unknown) => valor !== undefined);

export class EditarAdicionalDto {
  @SoloSiViene()
  @CampoNombre()
  nombre?: string;

  @SoloSiViene()
  @CampoPrecio()
  precio?: number;
}
