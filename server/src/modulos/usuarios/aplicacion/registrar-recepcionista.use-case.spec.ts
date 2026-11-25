import { EnMemoriaRecepcionistaRepository } from '../../../../test/usuarios/dobles/en-memoria-recepcionista.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { unaRecepcionistaValida } from '../../../../test/usuarios/fabricas/datos-recepcionista';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { Celular } from '../dominio/celular.value-object';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { Correo } from '../../../compartido/dominio/correo.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../../../compartido/dominio/nombre-persona.value-object';
import { ReactivacionDisponibleError } from '../dominio/reactivacion-disponible.error';
import { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { Usuario } from '../dominio/usuario.entity';
import { RegistrarRecepcionistaUseCase } from './registrar-recepcionista.use-case';

const ADMINISTRADOR = 99;
const hasheador = {
  hashear: (contrasena: Contrasena) =>
    Promise.resolve(`hash(${contrasena.texto})`),
};

function preparar() {
  const recepcionistas = new EnMemoriaRecepcionistaRepository();
  const reloj = new RelojDePrueba();
  const registrar = new RegistrarRecepcionistaUseCase(
    recepcionistas,
    hasheador,
    { reloj, correos: new ReglasDeCorreo('laprevia.pe') },
  );
  return { recepcionistas, registrar, reloj };
}

function unaCuenta(rol: 'RECEPCIONISTA' | 'JUGADOR', correo: string) {
  const datos = {
    nombres: NombrePersona.crear('Rosa', 'nombres'),
    apellidos: NombrePersona.crear('Quispe', 'apellidos'),
    fechaNacimiento: FechaNacimiento.restaurar('1995-02-01'),
    documento: DocumentoIdentidad.crear('DNI', '41234567'),
    correo: Correo.crear(correo),
    celular: Celular.crear('912345678'),
    contrasenaHash: 'hash',
  };
  return rol === 'JUGADOR'
    ? Usuario.registrarJugador(datos)
    : Usuario.registrarRecepcionista(
        datos,
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

describe('RegistrarRecepcionistaUseCase', () => {
  it('crea la recepcionista activa con su correo institucional y la contraseña temporal con hash', async () => {
    const { recepcionistas, registrar } = preparar();

    await registrar.ejecutar(unaRecepcionistaValida(), ADMINISTRADOR);

    const [guardada] = recepcionistas.todas();
    expect(guardada.rol).toBe('RECEPCIONISTA');
    expect(guardada.estaActivo()).toBe(true);
    expect(guardada.correo.direccion).toBe('rosa.quispe@laprevia.pe');
    expect(guardada.contrasenaHash).toBe('hash(temporal2026)');
    expect(guardada.requiereCambiarContrasena).toBe(true);
  });

  it('la contraseña temporal sirve por 7 días', async () => {
    const { recepcionistas, registrar, reloj } = preparar();

    await registrar.ejecutar(unaRecepcionistaValida(), ADMINISTRADOR);

    expect(recepcionistas.todas()[0].contrasenaTemporalVenceEn).toEqual(
      new Date(reloj.ahora().getTime() + 7 * 24 * 60 * 60 * 1000),
    );
  });

  it('registra el alta en la auditoría con el administrador y la hora', async () => {
    const { recepcionistas, registrar, reloj } = preparar();

    const { id } = await registrar.ejecutar(
      unaRecepcionistaValida(),
      ADMINISTRADOR,
    );

    expect(recepcionistas.acciones).toEqual([
      {
        accion: 'ALTA',
        ejecutadoPorId: ADMINISTRADOR,
        ocurridoEn: reloj.ahora(),
        usuarioAfectadoId: id,
      },
    ]);
  });

  it('rechaza el documento de una recepcionista activa y no crea otra cuenta', async () => {
    const { recepcionistas, registrar } = preparar();
    recepcionistas.agregar(unaCuenta('RECEPCIONISTA', 'rosa@laprevia.pe'));

    const error = await capturarError(
      registrar.ejecutar(unaRecepcionistaValida(), ADMINISTRADOR),
    );

    expect(error).toBeInstanceOf(CuentaYaExisteError);
    expect((error as CuentaYaExisteError).errores).toEqual({
      numeroDocumento:
        'Este documento ya tiene una cuenta de recepción activa.',
    });
    expect(recepcionistas.todas()).toHaveLength(1);
  });

  it('rechaza un correo ya registrado para otra cuenta del personal', async () => {
    const { recepcionistas, registrar } = preparar();
    recepcionistas.agregar(
      unaCuenta('RECEPCIONISTA', 'rosa.quispe@laprevia.pe'),
    );

    const error = await capturarError(
      registrar.ejecutar(
        unaRecepcionistaValida({ numeroDocumento: '47654321' }),
        ADMINISTRADOR,
      ),
    );

    expect((error as CuentaYaExisteError).errores).toEqual({
      correo: 'Este correo ya fue registrado para otra cuenta del personal.',
    });
  });

  it.each([
    ['el documento', { usuarioDeCorreo: 'otra.persona' }],
    ['el correo', { numeroDocumento: '47654321' }],
  ])(
    'ofrece reactivar a la recepcionista desactivada que coincide en %s',
    async (_, cambios) => {
      const { recepcionistas, registrar } = preparar();
      const id = recepcionistas.agregar(
        unaCuenta('RECEPCIONISTA', 'rosa.quispe@laprevia.pe'),
        'INACTIVO',
      );

      const error = await capturarError(
        registrar.ejecutar(unaRecepcionistaValida(cambios), ADMINISTRADOR),
      );

      expect(error).toBeInstanceOf(ReactivacionDisponibleError);
      expect((error as ReactivacionDisponibleError).datos).toEqual({
        reactivable: { id, nombres: 'Rosa' },
      });
      expect(recepcionistas.todas()).toHaveLength(1);
    },
  );

  it('rechaza en vez de ofrecer reactivar si otro dato pertenece a una cuenta activa', async () => {
    const { recepcionistas, registrar } = preparar();
    recepcionistas.agregar(
      unaCuenta('RECEPCIONISTA', 'antes@laprevia.pe'),
      'INACTIVO',
    );
    recepcionistas.agregar(
      unaCuenta('RECEPCIONISTA', 'rosa.quispe@laprevia.pe'),
      'ACTIVO',
    );

    const error = await capturarError(
      registrar.ejecutar(unaRecepcionistaValida(), ADMINISTRADOR),
    );

    expect(error).toBeInstanceOf(CuentaYaExisteError);
  });

  it('crea la cuenta aunque el documento tenga una cuenta de jugador', async () => {
    const { recepcionistas, registrar } = preparar();
    recepcionistas.agregar(unaCuenta('JUGADOR', 'rosa@gmail.com'));

    await registrar.ejecutar(unaRecepcionistaValida(), ADMINISTRADOR);

    expect(recepcionistas.todas()).toHaveLength(2);
  });

  it('reúne los errores de los datos y no guarda nada', async () => {
    const { recepcionistas, registrar } = preparar();

    const error = await capturarError(
      registrar.ejecutar(
        unaRecepcionistaValida({
          fechaNacimiento: '2012-01-01',
          usuarioDeCorreo: 'rosa@gmail.com',
          contrasena: 'corta',
        }),
        ADMINISTRADOR,
      ),
    );

    expect(error).toBeInstanceOf(ReglaInvalidaError);
    expect(Object.keys((error as ReglaInvalidaError).errores)).toEqual([
      'fechaNacimiento',
      'correo',
      'contrasena',
    ]);
    expect(recepcionistas.todas()).toHaveLength(0);
  });
});
