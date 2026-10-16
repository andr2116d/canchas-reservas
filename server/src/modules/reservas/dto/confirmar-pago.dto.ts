import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import type { MetodoPago } from '../../../generated/prisma/enums';

export const METODOS_CONFIRMACION = [
  'YAPE',
  'PLIN',
  'TRANSFERENCIA',
  'EFECTIVO',
] as const satisfies readonly MetodoPago[];

export const MENSAJES_CONFIRMAR_PAGO = {
  metodo: 'Elige un método de pago válido',
  pagoCompleto: 'Indica si se pagó el turno completo',
  numeroOperacion:
    'El número de operación solo puede tener letras, números y guiones (máximo 30)',
} as const;

export class ConfirmarPagoDto {
  @IsIn(METODOS_CONFIRMACION, { message: MENSAJES_CONFIRMAR_PAGO.metodo })
  metodo!: (typeof METODOS_CONFIRMACION)[number];

  @IsOptional()
  @IsBoolean({ message: MENSAJES_CONFIRMAR_PAGO.pagoCompleto })
  pagoCompleto?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString({ message: MENSAJES_CONFIRMAR_PAGO.numeroOperacion })
  @MaxLength(30, { message: MENSAJES_CONFIRMAR_PAGO.numeroOperacion })
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: MENSAJES_CONFIRMAR_PAGO.numeroOperacion,
  })
  numeroOperacion?: string;
}
