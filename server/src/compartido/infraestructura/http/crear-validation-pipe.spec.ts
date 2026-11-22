import { BadRequestException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { crearValidationPipe } from './crear-validation-pipe';

class DatosDePrueba {
  @IsString({ message: 'Ingresa tu nombre.' })
  nombre: string;
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
});
