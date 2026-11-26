import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { crearValidationPipe } from './crear-validation-pipe';

class ElementoDePrueba {
  @IsBoolean({ message: 'Indica si está activo.' })
  activo: boolean;
}

class DatosDePrueba {
  @IsString({ message: 'Ingresa tu nombre.' })
  nombre: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ElementoDePrueba)
  elementos?: ElementoDePrueba[];
}

async function validar(cuerpo: object) {
  return crearValidationPipe().transform(cuerpo, {
    type: 'body',
    metatype: DatosDePrueba,
  });
}

async function capturarRechazo(cuerpo: object) {
  return validar(cuerpo).then(
    () => {
      throw new Error('Se esperaba un rechazo');
    },
    (error: BadRequestException) => error.getResponse(),
  );
}

describe('crearValidationPipe', () => {
  it('deja pasar los datos permitidos', async () => {
    await expect(validar({ nombre: 'Ana' })).resolves.toEqual({
      nombre: 'Ana',
    });
  });

  it('responde en español con el mensaje de cada campo', async () => {
    await expect(capturarRechazo({})).resolves.toEqual({
      mensaje: 'Revisa los datos marcados.',
      errores: { nombre: 'Ingresa tu nombre.' },
    });
  });

  it('rechaza campos que no forman parte de la solicitud', async () => {
    await expect(
      capturarRechazo({ nombre: 'Ana', rol: 'ADMINISTRADOR' }),
    ).resolves.toEqual({
      mensaje: 'Revisa los datos marcados.',
      errores: { rol: 'Este campo no está permitido.' },
    });
  });

  it('nombra el campo de cada elemento de una lista con su posición', async () => {
    await expect(
      capturarRechazo({
        nombre: 'Ana',
        elementos: [{ activo: true }, { activo: 'sí', color: 'rojo' }],
      }),
    ).resolves.toEqual({
      mensaje: 'Revisa los datos marcados.',
      errores: {
        'elementos.1.activo': 'Indica si está activo.',
        'elementos.1.color': 'Este campo no está permitido.',
      },
    });
  });
});
