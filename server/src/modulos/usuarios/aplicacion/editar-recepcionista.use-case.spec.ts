import { EnMemoriaRecepcionistaRepository } from '../../../../test/usuarios/dobles/en-memoria-recepcionista.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { unaRecepcionistaValida } from '../../../../test/usuarios/fabricas/datos-recepcionista';
import {
  NoEncontradoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { EditarRecepcionistaUseCase } from './editar-recepcionista.use-case';
import { RegistrarRecepcionistaUseCase } from './registrar-recepcionista.use-case';

const ADMINISTRADOR = 99;

async function preparar() {
  const recepcionistas = new EnMemoriaRecepcionistaRepository();
  const reloj = new RelojDePrueba();
  const contexto = { reloj, correos: new ReglasDeCorreo('laprevia.pe') };
  const registrar = new RegistrarRecepcionistaUseCase(
    recepcionistas,
    { hashear: (c: Contrasena) => Promise.resolve(c.texto) },
    contexto,
  );
  const { id } = await registrar.ejecutar(
    unaRecepcionistaValida(),
    ADMINISTRADOR,
  );
  const otra = await registrar.ejecutar(
    unaRecepcionistaValida({
      numeroDocumento: '47654321',
      usuarioDeCorreo: 'mateo.paz',
    }),
    ADMINISTRADOR,
  );
  const editar = new EditarRecepcionistaUseCase(recepcionistas, contexto);
  return { recepcionistas, editar, reloj, id, otraId: otra.id };
}

const cambios = (datos = {}) => {
  const { contrasena: _, ...sinContrasena } = unaRecepcionistaValida(datos);
  return sinContrasena;
};

describe('EditarRecepcionistaUseCase', () => {
  it('actualiza todos sus datos y deja la edición en la auditoría', async () => {
    const { recepcionistas, editar, reloj, id } = await preparar();

    await editar.ejecutar(
      id,
      cambios({ celular: '987000111', usuarioDeCorreo: 'rosa.q' }),
      ADMINISTRADOR,
    );

    const editada = recepcionistas.todas()[0];
    expect(editada.celular?.numero).toBe('987000111');
    expect(editada.correo.direccion).toBe('rosa.q@laprevia.pe');
    expect(recepcionistas.acciones.at(-1)).toEqual({
      accion: 'EDICION',
      ejecutadoPorId: ADMINISTRADOR,
      ocurridoEn: reloj.ahora(),
      usuarioAfectadoId: id,
    });
  });

  it('permite conservar su propio documento y correo', async () => {
    const { editar, id } = await preparar();

    await expect(
      editar.ejecutar(id, cambios({ nombres: 'Rosa Elena' }), ADMINISTRADOR),
    ).resolves.toBeUndefined();
  });

  it('rechaza el documento o el correo de otra cuenta del personal', async () => {
    const { editar, id } = await preparar();

    const error = await editar
      .ejecutar(
        id,
        cambios({ numeroDocumento: '47654321', usuarioDeCorreo: 'mateo.paz' }),
        ADMINISTRADOR,
      )
      .catch((e: unknown) => e);

    expect((error as CuentaYaExisteError).errores).toEqual({
      numeroDocumento:
        'Este documento ya pertenece a otra cuenta de recepción.',
      correo: 'Este correo ya fue registrado para otra cuenta del personal.',
    });
  });

  it('valida los datos igual que en el alta', async () => {
    const { editar, id } = await preparar();

    await expect(
      editar.ejecutar(id, cambios({ celular: '12' }), ADMINISTRADOR),
    ).rejects.toBeInstanceOf(ReglaInvalidaError);
  });

  it('avisa que no existe si el id no es de una recepcionista', async () => {
    const { editar } = await preparar();

    await expect(
      editar.ejecutar(404, cambios(), ADMINISTRADOR),
    ).rejects.toBeInstanceOf(NoEncontradoError);
  });
});
