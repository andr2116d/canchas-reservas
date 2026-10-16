import { BadRequestException } from '@nestjs/common';
import { crearValidationPipe } from '../../../common/validacion/validation-pipe';
import {
  ActualizarReglaCancelacionDto,
  HORAS_MAXIMAS,
  MENSAJE_HORAS_ENTERO,
  MENSAJE_HORAS_MAXIMO,
  MENSAJE_HORAS_MINIMO,
} from './actualizar-regla-cancelacion.dto';

const pipe = crearValidationPipe();

const errorDeHoras = async (horasAnticipacion: unknown) => {
  const error = await pipe
    .transform(
      { horasAnticipacion, tipoCompensacion: 'CREDITO' },
      { type: 'body', metatype: ActualizarReglaCancelacionDto },
    )
    .catch((e: unknown) => e);
  expect(error).toBeInstanceOf(BadRequestException);
  return (
    (error as BadRequestException).getResponse() as {
      errores: Record<string, string>;
    }
  ).errores.horasAnticipacion;
};

describe('Validaciones de la regla de cancelación', () => {
  it.each([undefined, null, '', 'abc', '24', 1.5, true])(
    'con horas %p muestra el mensaje de entero',
    async (horas) => {
      expect(await errorDeHoras(horas)).toBe(MENSAJE_HORAS_ENTERO);
    },
  );

  it('con horas negativas muestra el mínimo', async () => {
    expect(await errorDeHoras(-1)).toBe(MENSAJE_HORAS_MINIMO);
  });

  it('sobre el tope muestra el máximo sin el número técnico', async () => {
    const mensaje = await errorDeHoras(HORAS_MAXIMAS + 1);
    expect(mensaje).toBe(MENSAJE_HORAS_MAXIMO);
    expect(mensaje).not.toContain(String(HORAS_MAXIMAS));
  });

  it('acepta 0 y el tope', async () => {
    for (const horas of [0, HORAS_MAXIMAS]) {
      await expect(
        pipe.transform(
          { horasAnticipacion: horas, tipoCompensacion: 'CREDITO' },
          { type: 'body', metatype: ActualizarReglaCancelacionDto },
        ),
      ).resolves.toMatchObject({ horasAnticipacion: horas });
    }
  });
});
