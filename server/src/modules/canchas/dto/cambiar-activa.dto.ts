import { IsBoolean, ValidateIf } from 'class-validator';

export class CambiarActivaDto {
  @IsBoolean({ message: 'Indica si la cancha queda activa' })
  activa!: boolean;

  @ValidateIf((_objeto, valor: unknown) => valor !== undefined)
  @IsBoolean({ message: 'Indica si confirmas la desactivación' })
  confirmar?: boolean;
}
