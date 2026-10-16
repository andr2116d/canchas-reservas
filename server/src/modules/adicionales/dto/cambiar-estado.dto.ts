import { IsBoolean } from 'class-validator';

export class CambiarEstadoDto {
  @IsBoolean({ message: 'Indica si el adicional queda activo' })
  activo!: boolean;
}
