import { BadRequestException } from '@nestjs/common';
import { crearValidationPipe } from '../../../common/validacion/validation-pipe';
import {
  CrearAdicionalDto,
  MENSAJE_NOMBRE_LONGITUD,
  MENSAJE_NOMBRE_OBLIGATORIO,
  MENSAJE_PRECIO_DECIMALES,
  MENSAJE_PRECIO_MAXIMO,
  MENSAJE_PRECIO_POSITIVO,
} from './crear-adicional.dto';
import { EditarAdicionalDto } from './editar-adicional.dto';
import {
  ListarAdicionalesDto,
  MENSAJE_FILTRO_ACTIVO,
} from './listar-adicionales.dto';

const pipe = crearValidationPipe();

const validar = (metatype: new () => object, valor: unknown) =>
  pipe.transform(valor, { type: 'body', metatype });

const erroresDe = async (metatype: new () => object, valor: unknown) => {
  const error = await validar(metatype, valor).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(BadRequestException);
  return (
    (error as BadRequestException).getResponse() as {
      errores: Record<string, string>;
    }
  ).errores;
};

describe('Validaciones de adicional', () => {
  it('acepta nombre y precio validos y recorta los espacios del nombre', async () => {
    const dto = (await validar(CrearAdicionalDto, {
      nombre: '  Agua   mineral  ',
      precio: 5.5,
    })) as CrearAdicionalDto;

    expect(dto.nombre).toBe('Agua mineral');
    expect(dto.precio).toBe(5.5);
  });

  it('precio 0 devuelve 400', async () => {
    expect(
      await erroresDe(CrearAdicionalDto, { nombre: 'Agua', precio: 0 }),
    ).toEqual({ precio: MENSAJE_PRECIO_POSITIVO });
  });

  it('rechaza precio negativo, mayor que 9999.99 y con mas de 2 decimales', async () => {
    expect(
      await erroresDe(CrearAdicionalDto, { nombre: 'Agua', precio: -1 }),
    ).toEqual({ precio: MENSAJE_PRECIO_POSITIVO });
    expect(
      await erroresDe(CrearAdicionalDto, { nombre: 'Agua', precio: 10000 }),
    ).toEqual({ precio: MENSAJE_PRECIO_MAXIMO });
    expect(
      await erroresDe(CrearAdicionalDto, { nombre: 'Agua', precio: 1.234 }),
    ).toEqual({ precio: MENSAJE_PRECIO_DECIMALES });
  });

  it('el nombre es obligatorio y va de 2 a 40 caracteres', async () => {
    expect(await erroresDe(CrearAdicionalDto, { precio: 5 })).toEqual({
      nombre: MENSAJE_NOMBRE_OBLIGATORIO,
    });
    expect(
      await erroresDe(CrearAdicionalDto, { nombre: 'A', precio: 5 }),
    ).toEqual({ nombre: MENSAJE_NOMBRE_LONGITUD });
    expect(
      await erroresDe(CrearAdicionalDto, { nombre: 'A'.repeat(41), precio: 5 }),
    ).toEqual({ nombre: MENSAJE_NOMBRE_LONGITUD });
  });

  it('al editar solo valida los campos que vienen', async () => {
    await expect(validar(EditarAdicionalDto, {})).resolves.toBeInstanceOf(
      EditarAdicionalDto,
    );
    expect(await erroresDe(EditarAdicionalDto, { precio: 0 })).toEqual({
      precio: MENSAJE_PRECIO_POSITIVO,
    });
    expect(await erroresDe(EditarAdicionalDto, { nombre: ' ' })).toEqual({
      nombre: MENSAJE_NOMBRE_LONGITUD,
    });
  });
});

describe('Filtro del listado de adicionales', () => {
  const filtrar = (valor: unknown) =>
    pipe.transform(valor, { type: 'query', metatype: ListarAdicionalesDto });

  it.each([
    ['true', true],
    ['false', false],
  ])('convierte activo=%s en booleano', async (texto, esperado) => {
    const dto = (await filtrar({ activo: texto })) as ListarAdicionalesDto;
    expect(dto.activo).toBe(esperado);
  });

  it('sin activo no filtra', async () => {
    const dto = (await filtrar({})) as ListarAdicionalesDto;
    expect(dto.activo).toBeUndefined();
  });

  it.each(['abc', 'TRUE', '1', ''])(
    'rechaza activo=%p con el motivo',
    async (texto) => {
      const error = await filtrar({ activo: texto }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: MENSAJE_FILTRO_ACTIVO,
        errores: { activo: MENSAJE_FILTRO_ACTIVO },
      });
    },
  );
});
