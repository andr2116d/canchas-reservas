import { EnMemoriaUsuarioRepository } from '../../../../test/usuarios/dobles/en-memoria-usuario.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { Celular } from '../dominio/celular.value-object';
import { Correo } from '../dominio/correo.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../dominio/nombre-persona.value-object';
import { Usuario } from '../dominio/usuario.entity';
import {
  CompletarMisDatosUseCase,
  type DatosParaConfirmar,
} from './completar-mis-datos.use-case';

const VENCE = new Date('2026-11-29T00:00:00.000Z');
const nombre = (texto: string, campo: 'nombres' | 'apellidos') =>
  NombrePersona.crear(texto, campo);

function datosCompletos(
  cambios: Partial<DatosParaConfirmar> = {},
): DatosParaConfirmar {
  return {
    nombres: 'Valeria',
    apellidos: 'León Paredes',
    fechaNacimiento: '1990-03-02',
    tipoDocumento: 'DNI',
    numeroDocumento: '45678912',
    celular: '987654321',
    ...cambios,
  };
}

async function preparar() {
  const usuarios = new EnMemoriaUsuarioRepository();
  const reloj = new RelojDePrueba(new Date('2026-11-24T15:00:00.000Z'));
  await usuarios.crearPersonal(
    Usuario.registrarPersonal(
      {
        nombres: nombre('Valeria', 'nombres'),
        apellidos: nombre('León', 'apellidos'),
        correo: Correo.crear('admin@laprevia.pe'),
        contrasenaHash: 'hash',
      },
      'ADMINISTRADOR',
      VENCE,
    ),
  );
  await usuarios.crearPersonal(
    Usuario.registrarRecepcionista(
      {
        nombres: nombre('Rossa', 'nombres'),
        apellidos: nombre('Quispe', 'apellidos'),
        fechaNacimiento: FechaNacimiento.restaurar('1995-02-01'),
        documento: DocumentoIdentidad.crear('DNI', '41234567'),
        correo: Correo.crear('rosa.quispe@laprevia.pe'),
        celular: Celular.crear('912345678'),
        contrasenaHash: 'hash',
      },
      VENCE,
    ),
  );
  return {
    usuarios,
    reloj,
    completar: new CompletarMisDatosUseCase(usuarios, reloj),
  };
}

const errorDe = (promesa: Promise<unknown>) =>
  promesa.then(
    () => {
      throw new Error('Se esperaba un error.');
    },
    (error: unknown) => error,
  );

describe('CompletarMisDatosUseCase', () => {
  it('el administrador completa todos sus datos y quedan confirmados y auditados', async () => {
    const { completar, usuarios, reloj } = await preparar();

    await completar.ejecutar(1, datosCompletos());

    const admin = await usuarios.buscarPorId(1);
    expect(admin?.documento?.numero).toBe('45678912');
    expect(admin?.fechaNacimiento?.fecha).toBe('1990-03-02');
    expect(admin?.celular?.numero).toBe('987654321');
    expect(admin?.apellidos.texto).toBe('León Paredes');
    expect(admin?.datosConfirmadosEn).toEqual(reloj.ahora());
    expect(usuarios.auditoria).toEqual([
      {
        usuarioId: 1,
        accion: 'CONFIRMACION_DE_DATOS',
        ocurridoEn: reloj.ahora(),
      },
    ]);
  });

  it('dice a la vez cada dato que falta o no es válido', async () => {
    const { completar } = await preparar();

    const error = await errorDe(
      completar.ejecutar(1, {
        nombres: '',
        apellidos: 'León',
        fechaNacimiento: '2010-01-01',
        tipoDocumento: 'DNI',
        numeroDocumento: '12',
        celular: '1',
      }),
    );

    expect(Object.keys((error as ReglaInvalidaError).errores)).toEqual([
      'nombres',
      'fechaNacimiento',
      'celular',
      'numeroDocumento',
    ]);
  });

  it('no acepta un documento que ya usa otra cuenta de administración', async () => {
    const { completar, usuarios } = await preparar();
    await usuarios.crearPersonal(
      Usuario.restaurar({
        ...(await usuarios.buscarPorId(1))!.estadoGuardado,
        id: 3,
        correo: Correo.crear('otra@laprevia.pe'),
        documento: DocumentoIdentidad.crear('DNI', '45678912'),
      }),
    );

    await expect(completar.ejecutar(1, datosCompletos())).rejects.toThrow(
      CuentaYaExisteError,
    );
  });

  it('la recepcionista corrige su nombre y confirma sin cambiar su documento', async () => {
    const { completar, usuarios } = await preparar();

    await completar.ejecutar(2, {
      ...datosCompletos({ nombres: 'Rosa', apellidos: 'Quispe' }),
      tipoDocumento: undefined,
      numeroDocumento: undefined,
    });

    const recepcionista = await usuarios.buscarPorId(2);
    expect(recepcionista?.nombres.texto).toBe('Rosa');
    expect(recepcionista?.documento?.numero).toBe('41234567');
    expect(recepcionista?.datosConfirmadosEn).toBeDefined();
  });

  it('la recepcionista no puede cambiar su documento al confirmar', async () => {
    const { completar } = await preparar();

    const error = await errorDe(
      completar.ejecutar(2, datosCompletos({ numeroDocumento: '49999999' })),
    );

    expect((error as ReglaInvalidaError).errores).toEqual({
      numeroDocumento:
        'El documento identifica a la persona y no se puede cambiar.',
    });
  });

  it('con los datos ya confirmados no cambia nada', async () => {
    const { completar, usuarios } = await preparar();
    await completar.ejecutar(1, datosCompletos());

    const error = await errorDe(
      completar.ejecutar(1, datosCompletos({ nombres: 'Otra' })),
    );

    expect(error).toBeInstanceOf(ConflictoError);
    expect((await usuarios.buscarPorId(1))?.nombres.texto).toBe('Valeria');
  });
});
