import { EnMemoriaAdicionalRepository } from '../../../../test/dobles/en-memoria-adicional.repository';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { unAdicionalValido } from '../../../../test/fabricas/datos-adicional';
import { Adicional } from '../dominio/adicional.entity';
import { AdicionalNoEncontradoError } from '../dominio/adicional-no-encontrado.error';
import {
  DesactivarAdicionalUseCase,
  ReactivarAdicionalUseCase,
} from './estado-de-adicional.use-case';

const ADMINISTRADOR = 7;

describe('Desactivar y reactivar un adicional', () => {
  let adicionales: EnMemoriaAdicionalRepository;
  let reloj: RelojDePrueba;
  let desactivar: DesactivarAdicionalUseCase;
  let reactivar: ReactivarAdicionalUseCase;

  beforeEach(async () => {
    adicionales = new EnMemoriaAdicionalRepository();
    reloj = new RelojDePrueba();
    desactivar = new DesactivarAdicionalUseCase(adicionales, reloj);
    reactivar = new ReactivarAdicionalUseCase(adicionales, reloj);
    await adicionales.registrar(Adicional.crear(unAdicionalValido()), {
      ejecutadoPorId: ADMINISTRADOR,
      ocurridoEn: new Date('2026-11-20T15:00:00Z'),
    });
  });

  const acciones = () => adicionales.auditoria.map((c) => c.accion);

  it('lo desactiva y lo deja en la auditoría con quién y cuándo', async () => {
    await desactivar.ejecutar(1, ADMINISTRADOR);

    expect((await adicionales.buscar(1))?.ficha.estado).toBe('DESACTIVADO');
    expect(adicionales.auditoria.at(-1)).toMatchObject({
      accion: 'DESACTIVACION',
      ejecutadoPorId: ADMINISTRADOR,
      ocurridoEn: reloj.ahora(),
    });
  });

  it('desactivarlo dos veces no falla ni deja otro registro', async () => {
    await desactivar.ejecutar(1, ADMINISTRADOR);
    await desactivar.ejecutar(1, ADMINISTRADOR);

    expect(acciones()).toEqual(['ALTA', 'DESACTIVACION']);
  });

  it('lo reactiva una vez, aunque se pida dos', async () => {
    await desactivar.ejecutar(1, ADMINISTRADOR);

    await reactivar.ejecutar(1, ADMINISTRADOR);
    await reactivar.ejecutar(1, ADMINISTRADOR);

    expect((await adicionales.buscar(1))?.ficha.estado).toBe('ACTIVO');
    expect(acciones()).toEqual(['ALTA', 'DESACTIVACION', 'REACTIVACION']);
  });

  it('avisa si el adicional no existe', async () => {
    await expect(desactivar.ejecutar(99, ADMINISTRADOR)).rejects.toThrow(
      AdicionalNoEncontradoError,
    );
    await expect(reactivar.ejecutar(99, ADMINISTRADOR)).rejects.toThrow(
      AdicionalNoEncontradoError,
    );
  });
});
