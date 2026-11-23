import { conUnaRecepcionista } from '../../../../test/dobles/recepcionista-guardada';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { RestablecerContrasenaUseCase } from './restablecer-contrasena.use-case';

const ADMINISTRADOR = 99;
const hasheador = {
  hashear: (contrasena: Contrasena) =>
    Promise.resolve(`hash(${contrasena.texto})`),
};

describe('RestablecerContrasenaUseCase', () => {
  it('asigna una temporal nueva, cierra sus sesiones y lo deja en la auditoría', async () => {
    const { recepcionistas, id } = conUnaRecepcionista();
    const reloj = new RelojDePrueba();

    await new RestablecerContrasenaUseCase(
      recepcionistas,
      hasheador,
      reloj,
    ).ejecutar(id, 'nueva2026', ADMINISTRADOR);

    const [cuenta] = recepcionistas.todas();
    expect(cuenta.contrasenaHash).toBe('hash(nueva2026)');
    expect(cuenta.requiereCambiarContrasena).toBe(true);
    expect(recepcionistas.sesionesCerradas).toEqual([id]);
    expect(recepcionistas.acciones[0].accion).toBe(
      'RESTABLECIMIENTO_DE_CONTRASENA',
    );
  });

  it('pide reactivar antes a una cuenta desactivada', async () => {
    const { recepcionistas, id } = conUnaRecepcionista('INACTIVO');

    await expect(
      new RestablecerContrasenaUseCase(
        recepcionistas,
        hasheador,
        new RelojDePrueba(),
      ).ejecutar(id, 'nueva2026', ADMINISTRADOR),
    ).rejects.toThrow(
      new ConflictoError(
        'Reactiva la cuenta antes de restablecer su contraseña.',
        {},
      ),
    );
  });
});
