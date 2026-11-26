import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { EnMemoriaAdicionalRepository } from '../../../../test/adicionales/dobles/en-memoria-adicional.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { UsosDeAdicionalDePrueba } from '../../../../test/adicionales/dobles/usos-de-adicional-de-prueba';
import { unAdicionalValido } from '../../../../test/adicionales/fabricas/datos-adicional';
import { Adicional } from '../dominio/adicional.entity';
import { AdicionalNoEncontradoError } from '../dominio/adicional-no-encontrado.error';
import { EditarAdicionalUseCase } from './editar-adicional.use-case';

const ADMINISTRADOR = 7;

describe('EditarAdicionalUseCase', () => {
  let adicionales: EnMemoriaAdicionalRepository;
  let usos: UsosDeAdicionalDePrueba;
  let reloj: RelojDePrueba;
  let editar: EditarAdicionalUseCase;
  const autoria = {
    ejecutadoPorId: ADMINISTRADOR,
    ocurridoEn: new Date('2026-11-20T15:00:00Z'),
  };

  beforeEach(async () => {
    adicionales = new EnMemoriaAdicionalRepository();
    usos = new UsosDeAdicionalDePrueba();
    reloj = new RelojDePrueba();
    editar = new EditarAdicionalUseCase(adicionales, usos, reloj);
    await adicionales.registrar(Adicional.crear(unAdicionalValido()), autoria);
    await adicionales.registrar(
      Adicional.crear(unAdicionalValido({ nombre: 'Chalecos', precio: '15' })),
      autoria,
    );
  });

  it('cambia el nombre y el precio y deja el antes y el después en la auditoría', async () => {
    const editado = await editar.ejecutar(
      1,
      unAdicionalValido({ nombre: 'Pelota', precio: '50' }),
      ADMINISTRADOR,
    );

    expect(editado).toMatchObject({ id: 1, nombre: 'Pelota', precio: '50.00' });
    expect(adicionales.auditoria.at(-1)).toEqual({
      accion: 'EDICION',
      nombreDelAdicional: 'Pelota',
      detalle: {
        nombre: { antes: 'Balón', despues: 'Pelota' },
        precio: { antes: '45.00', despues: '50.00' },
      },
      ejecutadoPorId: ADMINISTRADOR,
      ocurridoEn: reloj.ahora(),
    });
  });

  it('guardar los mismos datos no deja otro registro', async () => {
    const antes = adicionales.auditoria.length;

    await editar.ejecutar(
      1,
      unAdicionalValido({ precio: '45' }),
      ADMINISTRADOR,
    );

    expect(adicionales.auditoria).toHaveLength(antes);
  });

  it('puede cambiar solo las mayúsculas o tildes de su propio nombre', async () => {
    const editado = await editar.ejecutar(
      1,
      unAdicionalValido({ nombre: 'BALÓN' }),
      ADMINISTRADOR,
    );

    expect(editado.nombre).toBe('BALÓN');
  });

  it('no toma el nombre de otro adicional', async () => {
    const error = await editar
      .ejecutar(1, unAdicionalValido({ nombre: 'chalecos' }), ADMINISTRADOR)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictoError);
    expect((await adicionales.buscar(1))?.resumen.nombre).toBe('Balón');
  });

  it('con un precio inválido no cambia nada', async () => {
    await expect(
      editar.ejecutar(1, unAdicionalValido({ precio: '-3' }), ADMINISTRADOR),
    ).rejects.toThrow(ReglaInvalidaError);
    expect((await adicionales.buscar(1))?.resumen.precio).toBe('45.00');
  });

  it('dice si se puede eliminar según sus usos', async () => {
    usos.usar(1);

    const editado = await editar.ejecutar(
      1,
      unAdicionalValido({ precio: '48' }),
      ADMINISTRADOR,
    );

    expect(editado.sePuedeEliminar).toBe(false);
  });

  it('avisa si el adicional no existe', async () => {
    await expect(
      editar.ejecutar(99, unAdicionalValido(), ADMINISTRADOR),
    ).rejects.toThrow(AdicionalNoEncontradoError);
  });
});
