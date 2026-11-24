import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import { EnMemoriaAdicionalRepository } from '../../../../test/adicionales/dobles/en-memoria-adicional.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { UsosDeAdicionalDePrueba } from '../../../../test/adicionales/dobles/usos-de-adicional-de-prueba';
import { unAdicionalValido } from '../../../../test/adicionales/fabricas/datos-adicional';
import { Adicional } from '../dominio/adicional.entity';
import { AdicionalNoEncontradoError } from '../dominio/adicional-no-encontrado.error';
import { EliminarAdicionalUseCase } from './eliminar-adicional.use-case';

const ADMINISTRADOR = 7;

describe('EliminarAdicionalUseCase', () => {
  let adicionales: EnMemoriaAdicionalRepository;
  let usos: UsosDeAdicionalDePrueba;
  let reloj: RelojDePrueba;
  let eliminar: EliminarAdicionalUseCase;

  beforeEach(async () => {
    adicionales = new EnMemoriaAdicionalRepository();
    usos = new UsosDeAdicionalDePrueba();
    reloj = new RelojDePrueba();
    eliminar = new EliminarAdicionalUseCase(adicionales, usos, reloj);
    await adicionales.registrar(Adicional.crear(unAdicionalValido()), {
      ejecutadoPorId: ADMINISTRADOR,
      ocurridoEn: new Date('2026-11-20T15:00:00Z'),
    });
  });

  it('elimina uno que nunca se usó y la auditoría conserva su nombre', async () => {
    await eliminar.ejecutar(1, ADMINISTRADOR);

    expect(await adicionales.buscar(1)).toBeUndefined();
    expect(adicionales.auditoria.at(-1)).toMatchObject({
      accion: 'ELIMINACION',
      nombreDelAdicional: 'Balón',
      ejecutadoPorId: ADMINISTRADOR,
      ocurridoEn: reloj.ahora(),
    });
  });

  it('uno que ya se usó no se elimina: se pide desactivarlo', async () => {
    usos.usar(1);

    const error = await eliminar
      .ejecutar(1, ADMINISTRADOR)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictoError);
    expect((error as ConflictoError).message).toBe(
      'El adicional ya se usó en reservas. Desactívalo en lugar de eliminarlo.',
    );
    expect(await adicionales.buscar(1)).toBeDefined();
  });

  it('avisa si el adicional no existe', async () => {
    await expect(eliminar.ejecutar(99, ADMINISTRADOR)).rejects.toThrow(
      AdicionalNoEncontradoError,
    );
  });
});
