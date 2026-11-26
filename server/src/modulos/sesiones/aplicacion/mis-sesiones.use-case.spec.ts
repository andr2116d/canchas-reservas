import { EnMemoriaSesionRepository } from '../../../../test/sesiones/dobles/en-memoria-sesion.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { Sesion } from '../dominio/sesion.entity';
import { MisSesionesUseCase } from './mis-sesiones.use-case';

describe('MisSesionesUseCase', () => {
  const reloj = new RelojDePrueba(new Date('2026-11-24T15:00:00.000Z'));
  const abrir = (tokenHash: string, minutosAtras: number, usuarioId = 7) =>
    Sesion.abrir(
      usuarioId,
      Sesion.preparar(
        tokenHash,
        new Date(reloj.ahora().getTime() - minutosAtras * 60_000),
        'Chrome en Windows',
      ),
    );

  async function preparar() {
    const sesiones = new EnMemoriaSesionRepository();
    await sesiones.guardar(abrir('esta', 1));
    await sesiones.guardar(abrir('otra', 5));
    await sesiones.guardar(abrir('vencida', 30));
    await sesiones.guardar(abrir('ajena', 1, 9));
    return { sesiones, mis: new MisSesionesUseCase(sesiones, reloj) };
  }

  it('lista solo las sesiones vigentes de la persona y marca la actual, sin tokens', async () => {
    const { mis } = await preparar();

    const lista = await mis.consultar({ usuarioId: 7, tokenHash: 'esta' });

    expect(lista.map((s) => [s.dispositivo, s.actual])).toEqual([
      ['Chrome en Windows', true],
      ['Chrome en Windows', false],
    ]);
    expect(JSON.stringify(lista)).not.toContain('esta');
  });

  it('cierra todas menos la actual', async () => {
    const { mis, sesiones } = await preparar();

    await mis.cerrarOtras({ usuarioId: 7, tokenHash: 'esta' });

    expect(
      sesiones
        .todas()
        .map((s) => s.tokenHash)
        .sort(),
    ).toEqual(['ajena', 'esta']);
  });
});
