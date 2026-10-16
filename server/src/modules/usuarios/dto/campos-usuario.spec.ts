import { BadRequestException } from '@nestjs/common';
import { crearValidationPipe } from '../../../common/validacion/validation-pipe';
import { MENSAJE_OBLIGATORIO, MENSAJES_USUARIO } from './campos-usuario';
import { CrearRecepcionistaDto } from './crear-recepcionista.dto';
import { EditarRecepcionistaDto } from './editar-recepcionista.dto';
import { RegistrarJugadorDto } from './registrar-jugador.dto';

const VALIDO = {
  nombres: '  Ana María ',
  apellidos: 'Pérez Ñique',
  tipoDocumento: 'DNI',
  numeroDocumento: '71234567',
  correo: ' Ana@LaPrevia.PE ',
  telefono: '987654321',
  contrasena: 'Recepcion123',
};

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

describe('Validaciones de recepcionista', () => {
  it('acepta datos válidos, recorta espacios y pasa el correo a minúsculas', async () => {
    const dto = (await validar(
      CrearRecepcionistaDto,
      VALIDO,
    )) as CrearRecepcionistaDto;
    expect(dto.nombres).toBe('Ana María');
    expect(dto.correo).toBe('ana@laprevia.pe');
  });

  it('marca cada campo vacío como obligatorio', async () => {
    const errores = await erroresDe(CrearRecepcionistaDto, {});
    expect(errores).toEqual({
      nombres: MENSAJE_OBLIGATORIO,
      apellidos: MENSAJE_OBLIGATORIO,
      tipoDocumento: MENSAJE_OBLIGATORIO,
      numeroDocumento: MENSAJE_OBLIGATORIO,
      correo: MENSAJE_OBLIGATORIO,
      telefono: MENSAJE_OBLIGATORIO,
      contrasena: MENSAJE_OBLIGATORIO,
    });
  });

  it('muestra el mensaje de formato de cada campo', async () => {
    const errores = await erroresDe(CrearRecepcionistaDto, {
      nombres: 'A1',
      apellidos: 'X',
      tipoDocumento: 'PASAPORTE',
      numeroDocumento: '123',
      correo: 'sin-arroba',
      telefono: '812345678',
      contrasena: '1234567',
    });
    expect(errores).toEqual({
      nombres: MENSAJES_USUARIO.nombres,
      apellidos: MENSAJES_USUARIO.apellidos,
      tipoDocumento: MENSAJES_USUARIO.tipoDocumento,
      correo: MENSAJES_USUARIO.correo,
      telefono: MENSAJES_USUARIO.telefono,
      contrasena: MENSAJES_USUARIO.contrasena,
    });
  });

  it('valida el número según el tipo de documento', async () => {
    expect(
      await erroresDe(CrearRecepcionistaDto, {
        ...VALIDO,
        numeroDocumento: '7123456',
      }),
    ).toEqual({ numeroDocumento: MENSAJES_USUARIO.dni });
    expect(
      await erroresDe(CrearRecepcionistaDto, {
        ...VALIDO,
        tipoDocumento: 'CE',
        numeroDocumento: '12345678',
      }),
    ).toEqual({ numeroDocumento: MENSAJES_USUARIO.ce });
    await expect(
      validar(CrearRecepcionistaDto, {
        ...VALIDO,
        tipoDocumento: 'CE',
        numeroDocumento: 'AB1234567',
      }),
    ).resolves.toBeInstanceOf(CrearRecepcionistaDto);
  });

  it('al editar solo valida los campos que vienen y no acepta rol ni documento', async () => {
    await expect(validar(EditarRecepcionistaDto, {})).resolves.toBeInstanceOf(
      EditarRecepcionistaDto,
    );
    expect(await erroresDe(EditarRecepcionistaDto, { telefono: '' })).toEqual({
      telefono: MENSAJE_OBLIGATORIO,
    });
    expect(
      await erroresDe(EditarRecepcionistaDto, { apellidos: null }),
    ).toEqual({
      apellidos: MENSAJE_OBLIGATORIO,
    });
    const errores = await erroresDe(EditarRecepcionistaDto, {
      rol: 'ADMINISTRADOR',
      numeroDocumento: '71234567',
    });
    expect(Object.keys(errores).sort()).toEqual(['numeroDocumento', 'rol']);
  });
});

describe('Validaciones de jugador', () => {
  const JUGADOR = { ...VALIDO, contrasena: 'Cancha2026' };

  it('acepta datos válidos, recorta espacios y pasa el correo a minúsculas', async () => {
    const dto = (await validar(
      RegistrarJugadorDto,
      JUGADOR,
    )) as RegistrarJugadorDto;

    expect(dto.nombres).toBe('Ana María');
    expect(dto.correo).toBe('ana@laprevia.pe');
  });

  it('marca cada campo vacío como obligatorio', async () => {
    expect(await erroresDe(RegistrarJugadorDto, {})).toEqual({
      nombres: MENSAJE_OBLIGATORIO,
      apellidos: MENSAJE_OBLIGATORIO,
      tipoDocumento: MENSAJE_OBLIGATORIO,
      numeroDocumento: MENSAJE_OBLIGATORIO,
      correo: MENSAJE_OBLIGATORIO,
      telefono: MENSAJE_OBLIGATORIO,
      contrasena: MENSAJE_OBLIGATORIO,
    });
  });

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    expect(
      await erroresDe(RegistrarJugadorDto, {
        ...JUGADOR,
        contrasena: '1234567',
      }),
    ).toEqual({ contrasena: MENSAJES_USUARIO.contrasena });
  });

  it('rechaza un DNI de 7 dígitos y un correo sin @', async () => {
    expect(
      await erroresDe(RegistrarJugadorDto, {
        ...JUGADOR,
        numeroDocumento: '7123456',
      }),
    ).toEqual({ numeroDocumento: MENSAJES_USUARIO.dni });
    expect(
      await erroresDe(RegistrarJugadorDto, {
        ...JUGADOR,
        correo: 'lucia.correo',
      }),
    ).toEqual({ correo: MENSAJES_USUARIO.correo });
  });

  it('exige un celular de 9 dígitos que empiece con 9', async () => {
    expect(
      await erroresDe(RegistrarJugadorDto, {
        ...JUGADOR,
        telefono: '812345678',
      }),
    ).toEqual({ telefono: MENSAJES_USUARIO.telefono });
  });
});
