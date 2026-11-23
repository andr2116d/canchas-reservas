import { conUnaRecepcionista } from '../../../../test/dobles/recepcionista-guardada';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { ReactivarRecepcionistaUseCase } from './reactivar-recepcionista.use-case';

const ADMINISTRADOR = 99;
const hasheador = {
  hashear: (contrasena: Contrasena) =>
    Promise.resolve(`hash(${contrasena.texto})`),
};

function preparar(estado: 'ACTIVO' | 'INACTIVO' = 'INACTIVO') {
  const { recepcionistas, id } = conUnaRecepcionista(estado);
  const reloj = new RelojDePrueba();
  const reactivar = new ReactivarRecepcionistaUseCase(
    recepcionistas,
    hasheador,
    reloj,
  );
  return { recepcionistas, reactivar, reloj, id };
}

describe('ReactivarRecepcionistaUseCase', () => {
  it('reactiva la cuenta con sus datos y una contraseña temporal nueva', async () => {
    const { recepcionistas, reactivar, reloj, id } = preparar();

    await reactivar.ejecutar(id, 'nueva2026', ADMINISTRADOR);

    const [cuenta] = recepcionistas.todas();
    expect(cuenta.estaActivo()).toBe(true);
    expect(cuenta.correo.direccion).toBe('rosa.quispe@laprevia.pe');
    expect(cuenta.contrasenaHash).toBe('hash(nueva2026)');
    expect(cuenta.requiereCambiarContrasena).toBe(true);
    expect(recepcionistas.acciones).toEqual([
      {
        accion: 'REACTIVACION',
        ejecutadoPorId: ADMINISTRADOR,
        ocurridoEn: reloj.ahora(),
        usuarioAfectadoId: id,
      },
    ]);
  });

  it('exige una contraseña temporal válida', async () => {
    const { reactivar, id } = preparar();

    await expect(
      reactivar.ejecutar(id, 'corta', ADMINISTRADOR),
    ).rejects.toBeInstanceOf(ReglaInvalidaError);
  });

  it('avisa si la cuenta ya está activa', async () => {
    const { reactivar, id } = preparar('ACTIVO');

    await expect(
      reactivar.ejecutar(id, 'nueva2026', ADMINISTRADOR),
    ).rejects.toThrow(
      new ConflictoError('Esta recepcionista ya está activa.', {}),
    );
  });
});
