import { IsEnum, IsNumber, IsPositive, Max, ValidateBy } from 'class-validator';
import { Franja } from '../../../generated/prisma/enums';

export const VALOR_MAXIMO = 9999.99;
export const MENSAJE_VALOR_POSITIVO = 'El valor debe ser mayor que 0';
export const MENSAJE_VALOR_MAXIMO = 'El valor no puede ser mayor que 9999.99';
export const MENSAJE_VALOR_DECIMALES = 'El valor debe tener hasta 2 decimales';
export const MENSAJE_FRANJA = 'Elige la franja Día o Noche';

const HastaDosDecimales = () =>
  ValidateBy({
    name: 'hastaDosDecimales',
    validator: {
      validate: (valor: unknown) =>
        typeof valor !== 'number' || /^-?\d+(\.\d{1,2})?$/.test(String(valor)),
      defaultMessage: () => MENSAJE_VALOR_DECIMALES,
    },
  });

export class DefinirTarifaDto {
  @IsEnum(Franja, { message: MENSAJE_FRANJA })
  franja!: Franja;

  @HastaDosDecimales()
  @Max(VALOR_MAXIMO, { message: MENSAJE_VALOR_MAXIMO })
  @IsPositive({ message: MENSAJE_VALOR_POSITIVO })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: MENSAJE_VALOR_POSITIVO },
  )
  valor!: number;
}
