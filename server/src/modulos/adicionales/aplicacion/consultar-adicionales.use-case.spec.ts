import { EnMemoriaAdicionalRepository } from '../../../../test/dobles/en-memoria-adicional.repository';
import { UsosDeAdicionalDePrueba } from '../../../../test/dobles/usos-de-adicional-de-prueba';
import { unAdicionalValido } from '../../../../test/fabricas/datos-adicional';
import { Adicional } from '../dominio/adicional.entity';
import { ConsultarAdicionalesUseCase } from './consultar-adicionales.use-case';

describe('ConsultarAdicionalesUseCase', () => {
  let adicionales: EnMemoriaAdicionalRepository;
  let usos: UsosDeAdicionalDePrueba;
  let consultar: ConsultarAdicionalesUseCase;

  beforeEach(async () => {
    adicionales = new EnMemoriaAdicionalRepository();
    usos = new UsosDeAdicionalDePrueba();
    consultar = new ConsultarAdicionalesUseCase(adicionales, usos);
    for (const [nombre, ocurridoEn] of [
      ['Balón', '2026-11-20T15:00:00Z'],
      ['Chalecos', '2026-11-21T15:00:00Z'],
    ])
      await adicionales.registrar(
        Adicional.crear(unAdicionalValido({ nombre })),
        { ejecutadoPorId: 7, ocurridoEn: new Date(ocurridoEn) },
      );
  });

  it('lista los adicionales e indica cuáles se pueden eliminar', async () => {
    usos.usar(2);

    const lista = await consultar.listar();

    expect(
      lista.map((a) => [a.id, a.nombre, a.precio, a.sePuedeEliminar]),
    ).toEqual([
      [1, 'Balón', '45.00', true],
      [2, 'Chalecos', '45.00', false],
    ]);
  });

  it('devuelve los cambios más recientes primero, con la fecha en texto', async () => {
    const cambios = await consultar.cambios();

    expect(cambios.map((c) => c.nombreDelAdicional)).toEqual([
      'Chalecos',
      'Balón',
    ]);
    expect(cambios[0]).toMatchObject({
      accion: 'ALTA',
      ejecutadoPor: 'Administración 7',
      ocurridoEn: '2026-11-21T15:00:00.000Z',
    });
  });
});
