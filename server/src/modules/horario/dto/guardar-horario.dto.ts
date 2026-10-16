import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  ValidateBy,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CampoHora, DiaHorarioDto } from './dia-horario.dto';

export const MENSAJE_SIETE_DIAS =
  'Envía los 7 días de la semana, uno por cada día';

const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 7];

const UnoPorCadaDia = () =>
  ValidateBy({
    name: 'unoPorCadaDia',
    validator: {
      validate: (dias: unknown) => {
        if (!Array.isArray(dias) || dias.length !== DIAS_SEMANA.length) {
          return false;
        }
        const presentes = new Set(
          dias.map((dia: Partial<DiaHorarioDto> | null) => dia?.diaSemana),
        );
        return DIAS_SEMANA.every((dia) => presentes.has(dia));
      },
      defaultMessage: () => MENSAJE_SIETE_DIAS,
    },
  });

export class GuardarHorarioDto {
  @UnoPorCadaDia()
  @ValidateNested({ each: true })
  @Type(() => DiaHorarioDto)
  @IsArray({ message: MENSAJE_SIETE_DIAS })
  dias!: DiaHorarioDto[];

  @CampoHora('Indica la hora en que empieza la noche')
  inicioNoche!: string;

  @ValidateIf((_objeto, valor: unknown) => valor !== undefined)
  @IsBoolean({ message: 'Indica si confirmas el cambio de horario' })
  confirmar?: boolean;
}
