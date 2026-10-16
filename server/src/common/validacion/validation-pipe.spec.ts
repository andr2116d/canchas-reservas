import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import { crearValidationPipe } from './validation-pipe';

class DiaDto {
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Hora inválida' })
  apertura!: string;
}

class EjemploDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  @ValidateNested()
  @Type(() => DiaDto)
  dia!: DiaDto;
}

describe('crearValidationPipe', () => {
  const pipe = crearValidationPipe();
  const meta = { type: 'body' as const, metatype: EjemploDto };

  it('deja pasar datos válidos', async () => {
    const valor = await pipe.transform(
      { nombre: 'Cancha 1', dia: { apertura: '08:15' } },
      meta,
    );
    expect(valor).toBeInstanceOf(EjemploDto);
  });

  it('responde 400 con errores por campo, incluidos los anidados', async () => {
    expect.assertions(2);
    try {
      await pipe.transform({ nombre: '', dia: { apertura: '25:00' } }, meta);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'El nombre es obligatorio',
        errores: {
          nombre: 'El nombre es obligatorio',
          'dia.apertura': 'Hora inválida',
        },
      });
    }
  });

  it('rechaza en español los campos que el DTO no declara', async () => {
    expect.assertions(2);
    try {
      await pipe.transform(
        { nombre: 'x', dia: { apertura: '08:00', otro: 2 }, extra: 1 },
        meta,
      );
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'El campo extra no está permitido',
        errores: {
          extra: 'El campo extra no está permitido',
          'dia.otro': 'El campo dia.otro no está permitido',
        },
      });
    }
  });
});
