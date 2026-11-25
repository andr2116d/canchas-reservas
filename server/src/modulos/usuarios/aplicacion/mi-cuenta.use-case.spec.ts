import { EnMemoriaUsuarioRepository } from '../../../../test/usuarios/dobles/en-memoria-usuario.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import {
  LimiteExcedidoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { Celular } from '../dominio/celular.value-object';
import { Correo } from '../../../compartido/dominio/correo.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../../../compartido/dominio/nombre-persona.value-object';
import { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { Usuario } from '../dominio/usuario.entity';
import { ConsultarCuentaUseCase } from './consultar-cuenta.use-case';
import { ActualizarMiCuentaUseCase } from './actualizar-mi-cuenta.use-case';

function datos(correo: string) {
  return {
    nombres: NombrePersona.crear('Valeria', 'nombres'),
    apellidos: NombrePersona.crear('León', 'apellidos'),
    fechaNacimiento: FechaNacimiento.restaurar('1998-05-14'),
    documento: DocumentoIdentidad.crear('DNI', '45678912'),
    correo: Correo.crear(correo),
    celular: Celular.crear('987654321'),
    contrasenaHash: 'hash',
  };
}

async function preparar() {
  const usuarios = new EnMemoriaUsuarioRepository();
  const reloj = new RelojDePrueba();
  const contexto = { reloj, correos: new ReglasDeCorreo('laprevia.pe') };
  const jugador = await usuarios.crear(
    Usuario.registrarJugador(datos('valeria@gmail.com')),
  );
  await usuarios.crearPersonal(
    Usuario.registrarRecepcionista(
      datos('valeria.leon@laprevia.pe'),
      new Date('2026-11-29T00:00:00.000Z'),
    ),
  );
  const recepcionista = usuarios.todos()[1].id ?? 0;
  await usuarios.crearPersonal(
    Usuario.registrarPersonal(
      { ...datos('admin@laprevia.pe') },
      'ADMINISTRADOR',
      new Date('2026-11-29T00:00:00.000Z'),
    ),
  );
  const admin = usuarios.todos()[2].id ?? 0;
  return {
    usuarios,
    jugador,
    recepcionista,
    admin,
    consultar: new ConsultarCuentaUseCase(usuarios),
    actualizar: new ActualizarMiCuentaUseCase(usuarios, contexto),
  };
}

const sesionDe = (usuarioId: number) => ({ usuarioId, tokenHash: 'esta' });

describe('Mi cuenta', () => {
  it('muestra los propios datos y cuáles puede cambiar el jugador', async () => {
    const { consultar, jugador } = await preparar();

    await expect(consultar.ejecutar(jugador)).resolves.toMatchObject({
      rol: 'JUGADOR',
      nombres: 'Valeria',
      numeroDocumento: '45678912',
      correo: 'valeria@gmail.com',
      editables: ['correo', 'celular', 'dorsal'],
    });
  });

  it('la recepcionista corrige sus nombres y su fecha, pero no su correo ni su documento', async () => {
    const { consultar, recepcionista } = await preparar();

    await expect(consultar.ejecutar(recepcionista)).resolves.toMatchObject({
      rol: 'RECEPCIONISTA',
      correo: 'valeria.leon@laprevia.pe',
      editables: ['nombres', 'apellidos', 'fechaNacimiento', 'celular'],
    });
  });

  it('el jugador cambia su correo, su celular y su dorsal', async () => {
    const { actualizar, consultar, jugador } = await preparar();

    await actualizar.ejecutar(sesionDe(jugador), {
      correo: 'nueva@gmail.com',
      celular: '912000111',
      dorsal: '10',
    });

    await expect(consultar.ejecutar(jugador)).resolves.toMatchObject({
      correo: 'nueva@gmail.com',
      celular: '912000111',
      dorsal: 10,
    });
  });

  it('rechaza cambiar un dato que el rol no puede editar', async () => {
    const { actualizar, recepcionista } = await preparar();

    const error = await actualizar
      .ejecutar(sesionDe(recepcionista), { correo: 'otra@laprevia.pe' })
      .catch((e: unknown) => e);

    expect((error as ReglaInvalidaError).errores).toEqual({
      correo: 'Este dato no se puede cambiar desde la cuenta.',
    });
  });

  it('valida el dato nuevo con las reglas de siempre', async () => {
    const { actualizar, jugador } = await preparar();

    const error = await actualizar
      .ejecutar(sesionDe(jugador), {
        correo: 'nueva@laprevia.pe',
        celular: '12',
      })
      .catch((e: unknown) => e);

    expect(Object.keys((error as ReglaInvalidaError).errores)).toEqual([
      'correo',
      'celular',
    ]);
  });

  it('rechaza un correo que ya usa otra cuenta', async () => {
    const { actualizar, usuarios, jugador } = await preparar();
    await usuarios.crear(
      Usuario.registrarJugador({
        ...datos('ocupado@gmail.com'),
        documento: DocumentoIdentidad.crear('DNI', '11223344'),
      }),
    );

    await expect(
      actualizar.ejecutar(sesionDe(jugador), { correo: 'ocupado@gmail.com' }),
    ).rejects.toBeInstanceOf(CuentaYaExisteError);
  });

  it('ignora los datos que llegan sin valor', async () => {
    const { actualizar, recepcionista } = await preparar();

    await expect(
      actualizar.ejecutar(sesionDe(recepcionista), {
        celular: '912000111',
        correo: undefined,
      }),
    ).resolves.toBeUndefined();
  });

  it('conserva el correo propio aunque se envíe igual', async () => {
    const { actualizar, jugador } = await preparar();

    await expect(
      actualizar.ejecutar(sesionDe(jugador), { correo: 'VALERIA@gmail.com' }),
    ).resolves.toBeUndefined();
  });

  describe('cambios propios', () => {
    it('guardar los mismos datos no deja registro', async () => {
      const { actualizar, usuarios, recepcionista } = await preparar();

      await actualizar.ejecutar(sesionDe(recepcionista), {
        nombres: 'Valeria',
        celular: '987654321',
      });

      expect(usuarios.auditoria).toEqual([]);
    });

    it('corregir el nombre queda en la auditoría como edición propia', async () => {
      const { actualizar, usuarios, recepcionista, consultar } =
        await preparar();

      await actualizar.ejecutar(sesionDe(recepcionista), { nombres: 'Valery' });

      await expect(consultar.ejecutar(recepcionista)).resolves.toMatchObject({
        nombres: 'Valery',
      });
      expect(usuarios.auditoria.map((a) => a.accion)).toEqual([
        'EDICION_PROPIA',
      ]);
    });

    it('no deja cambiar los datos más de 10 veces en una hora', async () => {
      const { actualizar, recepcionista } = await preparar();
      for (let vez = 0; vez < 10; vez++)
        await actualizar.ejecutar(sesionDe(recepcionista), {
          celular: `91200011${vez}`,
        });

      await expect(
        actualizar.ejecutar(sesionDe(recepcionista), { celular: '913000000' }),
      ).rejects.toThrow(LimiteExcedidoError);
    });

    it('el administrador cambia su correo solo dentro del dominio y cierra sus otras sesiones', async () => {
      const { actualizar, usuarios, admin } = await preparar();

      const error = await actualizar
        .ejecutar(sesionDe(admin), { correo: 'admin@gmail.com' })
        .catch((e: unknown) => e);
      await actualizar.ejecutar(sesionDe(admin), {
        correo: 'direccion@laprevia.pe',
      });

      expect(Object.keys((error as ReglaInvalidaError).errores)).toEqual([
        'correo',
      ]);
      expect(usuarios.auditoria.map((a) => a.accion)).toEqual([
        'CAMBIO_DE_CORREO',
      ]);
      expect(usuarios.sesionConservada).toBe('esta');
    });

    it('no deja cambiar el correo más de 3 veces en un día', async () => {
      const { actualizar, admin } = await preparar();
      for (const usuario of ['uno', 'dos', 'tres'])
        await actualizar.ejecutar(sesionDe(admin), {
          correo: `${usuario}@laprevia.pe`,
        });

      await expect(
        actualizar.ejecutar(sesionDe(admin), { correo: 'cuatro@laprevia.pe' }),
      ).rejects.toThrow(LimiteExcedidoError);
    });
  });
});
