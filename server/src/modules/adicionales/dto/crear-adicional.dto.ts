import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsPositive,
  IsString,
  Length,
  Max,
  ValidateBy,
} from 'class-validator';

export const PRECIO_MAXIMO = 9999.99;
export const MENSAJE_NOMBRE_OBLIGATORIO = 'El nombre es obligatorio';
export const MENSAJE_NOMBRE_LONGITUD =
  'El nombre debe tener entre 2 y 40 caracteres';
export const MENSAJE_PRECIO_POSITIVO = 'El precio debe ser mayor que 0';
export const MENSAJE_PRECIO_MAXIMO = 'El precio no puede ser mayor que 9999.99';
export const MENSAJE_PRECIO_DECIMALES =
  'El precio debe tener hasta 2 decimales';

const HastaDosDecimales = () =>
  ValidateBy({
    name: 'hastaDosDecimales',
    validator: {
      validate: (valor: unknown) =>
        typeof valor !== 'number' || /^-?\d+(\.\d{1,2})?$/.test(String(valor)),
      defaultMessage: () => MENSAJE_PRECIO_DECIMALES,
    },
  });

export const CampoNombre = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
    ),
    IsString({ message: MENSAJE_NOMBRE_OBLIGATORIO }),
    Length(2, 40, { message: MENSAJE_NOMBRE_LONGITUD }),
  );

export const CampoPrecio = () =>
  applyDecorators(
    HastaDosDecimales(),
    Max(PRECIO_MAXIMO, { message: MENSAJE_PRECIO_MAXIMO }),
    IsPositive({ message: MENSAJE_PRECIO_POSITIVO }),
    IsNumber(
      { allowNaN: false, allowInfinity: false },
      { message: MENSAJE_PRECIO_POSITIVO },
    ),
  );

export class CrearAdicionalDto {
  @CampoNombre()
  nombre!: string;

  @CampoPrecio()
  precio!: number;
}
