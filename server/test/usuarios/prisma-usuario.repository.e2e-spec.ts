import { randomBytes } from 'node:crypto';
import { AesGcmCifradorAdapter } from '../../src/compartido/infraestructura/cifrado/aes-gcm-cifrador.adapter';
import { leerConfiguracion } from '../../src/compartido/infraestructura/configuracion/configuracion';
import { PrismaService } from '../../src/compartido/infraestructura/prisma/prisma.service';
import { Celular } from '../../src/modulos/usuarios/dominio/celular.value-object';
import { Correo } from '../../src/modulos/usuarios/dominio/correo.value-object';
import { CuentaYaExisteError } from '../../src/modulos/usuarios/dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../../src/modulos/usuarios/dominio/documento-identidad.value-object';
import { NombrePersona } from '../../src/modulos/usuarios/dominio/nombre-persona.value-object';
import { Usuario } from '../../src/modulos/usuarios/dominio/usuario.entity';
import { PrismaUsuarioRepository } from '../../src/modulos/usuarios/infraestructura/persistencia/prisma-usuario.repository';
import { limpiarTablas } from '../soporte/limpiar-tablas';

function unJugador(documento = '45678912', correo = 'valeria@gmail.com') {
  return Usuario.registrarJugador({
    nombres: NombrePersona.crear('Valeria', 'nombres'),
    apellidos: NombrePersona.crear('León', 'apellidos'),
    documento: DocumentoIdentidad.crear('DNI', documento),
    correo: Correo.crear(correo),
    celular: Celular.crear('987654321'),
    contrasenaHash: '$argon2id$hash-de-prueba',
  });
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

  beforeEach(() => limpiarTablas(prisma));
  afterAll(() => prisma.$disconnect());

  it('guarda los datos personales cifrados, nunca en claro', async () => {
    const id = await repositorio.crear(unJugador());

    const fila = await prisma.usuario.findUniqueOrThrow({ where: { id } });
    const guardado = JSON.stringify(fila);
    for (const dato of [
      'Valeria',
      'León',
      '45678912',
      'valeria@gmail.com',
      '987654321',
    ]) {
      expect(guardado).not.toContain(dato);
    }
    expect(cifrador.descifrar(fila.correoCifrado)).toBe('valeria@gmail.com');
  });

  it('guarda el rol jugador y el estado activo', async () => {
    const id = await repositorio.crear(unJugador());

    const fila = await prisma.usuario.findUniqueOrThrow({ where: { id } });
    expect(fila.rol).toBe('JUGADOR');
    expect(fila.estado).toBe('ACTIVO');
  });

  it('encuentra un documento y un correo ya registrados por su hash', async () => {
    await repositorio.crear(unJugador());

    await expect(
      repositorio.existeConDocumento(
        DocumentoIdentidad.crear('DNI', '45678912'),
      ),
    ).resolves.toBe(true);
    await expect(
      repositorio.existeConCorreo(Correo.crear('VALERIA@gmail.com')),
    ).resolves.toBe(true);
    await expect(
      repositorio.existeConCorreo(Correo.crear('otra@gmail.com')),
    ).resolves.toBe(false);
  });

  it('traduce un documento repetido que llega a la base en CuentaYaExisteError', async () => {
    await repositorio.crear(unJugador('45678912', 'primera@gmail.com'));

    const error = await capturarError(
      repositorio.crear(unJugador('45678912', 'segunda@gmail.com')),
    );

    expect(error).toBeInstanceOf(CuentaYaExisteError);
    expect((error as CuentaYaExisteError).repetidos).toEqual([
      'numeroDocumento',
    ]);
  });

  it('traduce un correo repetido que llega a la base en CuentaYaExisteError', async () => {
    await repositorio.crear(unJugador('45678912', 'valeria@gmail.com'));

    const error = await capturarError(
      repositorio.crear(unJugador('11223344', 'valeria@gmail.com')),
    );

    expect((error as CuentaYaExisteError).repetidos).toEqual(['correo']);
  });
});
