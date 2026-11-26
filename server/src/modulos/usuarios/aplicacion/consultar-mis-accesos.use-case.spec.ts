import { ConsultarMisAccesosUseCase } from './consultar-mis-accesos.use-case';

describe('ConsultarMisAccesosUseCase', () => {
  it('pide los últimos 10 accesos de la persona y los entrega con la fecha en texto', async () => {
    const ultimosAccesos = jest
      .fn()
      .mockResolvedValue([new Date('2026-11-24T15:00:00.000Z')]);

    const accesos = await new ConsultarMisAccesosUseCase({
      ultimosAccesos,
    }).ejecutar(7);

    expect(ultimosAccesos).toHaveBeenCalledWith(7, 10);
    expect(accesos).toEqual([{ ocurridoEn: '2026-11-24T15:00:00.000Z' }]);
  });
});
