import { conUnaRecepcionista } from '../../../../test/usuarios/dobles/recepcionista-guardada';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../compartido/dominio/dominio.error';
import { DesactivarRecepcionistaUseCase } from './desactivar-recepcionista.use-case';

const ADMINISTRADOR = 99;

describe('DesactivarRecepcionistaUseCase', () => {
  it('desactiva la cuenta, cierra sus sesiones y lo deja en la auditoría', async () => {
    const { recepcionistas, id } = conUnaRecepcionista();
    const reloj = new RelojDePrueba();

    await new DesactivarRecepcionistaUseCase(recepcionistas, reloj).ejecutar(
      id,
      ADMINISTRADOR,
    );

    expect(recepcionistas.todas()[0].estado).toBe('INACTIVO');
    expect(recepcionistas.sesionesCerradas).toEqual([id]);
    expect(recepcionistas.acciones).toEqual([
      {
        accion: 'DESACTIVACION',
        ejecutadoPorId: ADMINISTRADOR,
        ocurridoEn: reloj.ahora(),
        usuarioAfectadoId: id,
      },
    ]);
  });

  it('conserva sus datos para un posible reingreso', async () => {
    const { recepcionistas, id } = conUnaRecepcionista();

    await new DesactivarRecepcionistaUseCase(
      recepcionistas,
      new RelojDePrueba(),
    ).ejecutar(id, ADMINISTRADOR);

    expect(recepcionistas.todas()[0].correo.direccion).toBe(
      'rosa.quispe@laprevia.pe',
    );
  });

  it('avisa si ya estaba desactivada, sin registrar otra acción', async () => {
    const { recepcionistas, id } = conUnaRecepcionista('INACTIVO');

    const desactivar = new DesactivarRecepcionistaUseCase(
      recepcionistas,
      new RelojDePrueba(),
    ).ejecutar(id, ADMINISTRADOR);

    await expect(desactivar).rejects.toThrow(
      new ConflictoError('Esta cuenta ya está desactivada.', {}),
    );
    expect(recepcionistas.acciones).toHaveLength(0);
  });

  it('avisa que no existe si el id no es de una recepcionista', async () => {
    const { recepcionistas } = conUnaRecepcionista();

    await expect(
      new DesactivarRecepcionistaUseCase(
        recepcionistas,
        new RelojDePrueba(),
      ).ejecutar(404, ADMINISTRADOR),
    ).rejects.toBeInstanceOf(NoEncontradoError);
  });
});
