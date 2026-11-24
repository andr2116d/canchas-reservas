import { randomBytes } from 'node:crypto';
import { AesGcmCifradorAdapter } from '../../../src/compartido/infraestructura/cifrado/aes-gcm-cifrador.adapter';
import { leerConfiguracion } from '../../../src/compartido/infraestructura/configuracion/configuracion';
import { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { Sesion } from '../../../src/modulos/sesiones/dominio/sesion.entity';
import { Celular } from '../../../src/modulos/usuarios/dominio/celular.value-object';
import { Correo } from '../../../src/modulos/usuarios/dominio/correo.value-object';
import { CuentaYaExisteError } from '../../../src/modulos/usuarios/dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../../../src/modulos/usuarios/dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../../../src/modulos/usuarios/dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../../../src/modulos/usuarios/dominio/nombre-persona.value-object';
import { Usuario } from '../../../src/modulos/usuarios/dominio/usuario.entity';
import { PrismaUsuarioRepository } from '../../../src/modulos/usuarios/infraestructura/persistencia/prisma-usuario.repository';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';

function unJugador(documento = '45678912', correo = 'valeria@gmail.com') {
  return Usuario.registrarJugador({
    nombres: NombrePersona.crear('Valeria', 'nombres'),
    apellidos: NombrePersona.crear('León', 'apellidos'),
    fechaNacimiento: FechaNacimiento.restaurar('1998-05-14'),
    documento: DocumentoIdentidad.crear('DNI', documento),
    correo: Correo.crear(correo),
    celular: Celular.crear('987654321'),
    contrasenaHash: '$argon2id$hash-de-prueba',
  });
}

function unaRecepcionista(documento: string) {
  return Usuario.registrarRecepcionista(
    {
      nombres: NombrePersona.crear('Rosa', 'nombres'),
      apellidos: NombrePersona.crear('Quispe', 'apellidos'),
      fechaNacimiento: FechaNacimiento.restaurar('1995-02-01'),
      documento: DocumentoIdentidad.crear('DNI', documento),
      correo: Correo.crear('rosa.quispe@laprevia.pe'),
      celular: Celular.crear('912345678'),
      contrasenaHash: '$argon2id$hash-de-prueba',
    },
    new Date('2026-11-29T15:00:00.000Z'),
  );
}

async function capturarError(promesa: Promise<unknown>) {
  return promesa.then(
    () => {
      throw new Error('Se esperaba un error');
    },
    (error: unknown) => error,
  );
}

describe('PrismaUsuarioRepository', () => {
  const configuracion = leerConfiguracion({
    ...process.env,
    CLAVE_CIFRADO: randomBytes(32).toString('base64'),
    CLAVE_HASH: randomBytes(32).toString('base64'),
  });
  const prisma = new PrismaService(configuracion);
  const cifrador = new AesGcmCifradorAdapter(
    configuracion.claveCifrado,
    configuracion.claveHash,
  );
  const repositorio = new PrismaUsuarioRepository(prisma, cifrador);

  function guardarJugador(jugador = unJugador()): Promise<number> {
    const fecha = new Date();
    return repositorio.crear(jugador, {
      sesion: Sesion.preparar(randomBytes(32).toString('hex'), fecha),
      aceptacion: { version: 'registro-1', fecha, canal: 'web' },
    });
  }

  beforeEach(() => limpiarTablas(prisma));
  afterAll(() => prisma.$disconnect());

  it('guarda los datos personales cifrados, nunca en claro', async () => {
    const id = await guardarJugador();

    const fila = await prisma.usuario.findUniqueOrThrow({ where: { id } });
    const guardado = JSON.stringify(fila);
    for (const dato of [
      'Valeria',
      'León',
      '45678912',
      'valeria@gmail.com',
      '987654321',
      '1998-05-14',
    ]) {
      expect(guardado).not.toContain(dato);
    }
    expect(cifrador.descifrar(fila.correoCifrado)).toBe('valeria@gmail.com');
  });

  it('guarda el rol jugador y el estado activo', async () => {
    const id = await guardarJugador();

    const fila = await prisma.usuario.findUniqueOrThrow({ where: { id } });
    expect(fila.rol).toBe('JUGADOR');
    expect(fila.estado).toBe('ACTIVO');
  });

  it('encuentra un documento y un correo ya registrados por su hash', async () => {
    await guardarJugador();

    await expect(
      repositorio.existeConDocumento(
        DocumentoIdentidad.crear('DNI', '45678912'),
        'JUGADOR',
      ),
    ).resolves.toBe(true);
    await expect(
      repositorio.existeConCorreo(Correo.crear('VALERIA@gmail.com')),
    ).resolves.toBe(true);
    await expect(
      repositorio.existeConCorreo(Correo.crear('otra@gmail.com')),
    ).resolves.toBe(false);
  });

  it('recupera al usuario por su id con los datos descifrados', async () => {
    const id = await guardarJugador();

    const usuario = await repositorio.buscarPorId(id);

    expect(usuario?.nombres.texto).toBe('Valeria');
    expect(usuario?.documento?.identificador()).toBe('DNI:45678912');
    expect(usuario?.fechaNacimiento?.fecha).toBe('1998-05-14');
    expect(usuario?.correo.direccion).toBe('valeria@gmail.com');
    expect(usuario?.estaActivo()).toBe(true);
  });

  it('no devuelve nada si el id no existe', async () => {
    await expect(repositorio.buscarPorId(999)).resolves.toBeUndefined();
  });

  it('traduce un documento repetido que llega a la base en CuentaYaExisteError', async () => {
    await guardarJugador(unJugador('45678912', 'primera@gmail.com'));

    const error = await capturarError(
      guardarJugador(unJugador('45678912', 'segunda@gmail.com')),
    );

    expect(error).toBeInstanceOf(CuentaYaExisteError);
    expect((error as CuentaYaExisteError).repetidos).toEqual([
      'numeroDocumento',
    ]);
  });

  it('busca el documento solo entre las cuentas del mismo rol', async () => {
    await guardarJugador();
    const documento = DocumentoIdentidad.crear('DNI', '45678912');

    await expect(
      repositorio.existeConDocumento(documento, 'JUGADOR'),
    ).resolves.toBe(true);
    await expect(
      repositorio.existeConDocumento(documento, 'RECEPCIONISTA'),
    ).resolves.toBe(false);
  });

  it('permite el mismo documento en una cuenta de jugador y en una de personal', async () => {
    await guardarJugador();

    await repositorio.crearPersonal(unaRecepcionista('45678912'));

    expect(await prisma.usuario.count()).toBe(2);
  });

  it('traduce un correo repetido que llega a la base en CuentaYaExisteError', async () => {
    await guardarJugador(unJugador('45678912', 'valeria@gmail.com'));

    const error = await capturarError(
      guardarJugador(unJugador('11223344', 'valeria@gmail.com')),
    );

    expect((error as CuentaYaExisteError).repetidos).toEqual(['correo']);
  });
});
