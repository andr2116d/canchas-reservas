import { EnMemoriaUsuarioRepository } from '../../../../test/dobles/en-memoria-usuario.repository';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { Celular } from '../dominio/celular.value-object';
import { Correo } from '../dominio/correo.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../dominio/nombre-persona.value-object';
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
  return {
    usuarios,
    jugador,
    recepcionista,
    consultar: new ConsultarCuentaUseCase(usuarios),
    actualizar: new ActualizarMiCuentaUseCase(usuarios, contexto),
  };
}

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

  it('el personal solo puede cambiar su celular', async () => {
    const { consultar, recepcionista } = await preparar();

    await expect(consultar.ejecutar(recepcionista)).resolves.toMatchObject({
      rol: 'RECEPCIONISTA',
      correo: 'valeria.leon@laprevia.pe',
      editables: ['celular'],
    });
  });

  it('el jugador cambia su correo, su celular y su dorsal', async () => {
    const { actualizar, consultar, jugador } = await preparar();

    await actualizar.ejecutar(jugador, {
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
      .ejecutar(recepcionista, { correo: 'otra@laprevia.pe' })
      .catch((e: unknown) => e);

    expect((error as ReglaInvalidaError).errores).toEqual({
      correo: 'Este dato no se puede cambiar desde la cuenta.',
    });
  });

  it('valida el dato nuevo con las reglas de siempre', async () => {
    const { actualizar, jugador } = await preparar();

    const error = await actualizar
      .ejecutar(jugador, { correo: 'nueva@laprevia.pe', celular: '12' })
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
      actualizar.ejecutar(jugador, { correo: 'ocupado@gmail.com' }),
    ).rejects.toBeInstanceOf(CuentaYaExisteError);
  });

  it('ignora los datos que llegan sin valor', async () => {
    const { actualizar, recepcionista } = await preparar();

    await expect(
      actualizar.ejecutar(recepcionista, {
        celular: '912000111',
        correo: undefined,
      }),
    ).resolves.toBeUndefined();
  });

  it('conserva el correo propio aunque se envíe igual', async () => {
    const { actualizar, jugador } = await preparar();

    await expect(
      actualizar.ejecutar(jugador, { correo: 'VALERIA@gmail.com' }),
    ).resolves.toBeUndefined();
  });
});
