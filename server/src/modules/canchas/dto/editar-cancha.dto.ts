import { IsEnum, ValidateIf } from 'class-validator';
import { EstadoCancha, TamanoCancha } from '../../../generated/prisma/enums';
import {
  CampoIluminacion,
  CampoNombreCancha,
  CampoTamano,
} from './crear-cancha.dto';

const SoloSiViene = () =>
  ValidateIf((_objeto, valor: unknown) => valor !== undefined);

export class EditarCanchaDto {
  @SoloSiViene()
  @CampoNombreCancha()
  nombre?: string;

  @SoloSiViene()
  @CampoTamano()
  tamano?: TamanoCancha;

  @SoloSiViene()
  @CampoIluminacion()
  iluminacion?: boolean;

  @SoloSiViene()
  @IsEnum(EstadoCancha, { message: 'Elige Operativa o En mantenimiento' })
  estado?: EstadoCancha;
}
