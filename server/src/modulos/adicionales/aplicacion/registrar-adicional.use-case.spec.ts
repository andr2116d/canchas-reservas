import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { EnMemoriaAdicionalRepository } from '../../../../test/adicionales/dobles/en-memoria-adicional.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { unAdicionalValido } from '../../../../test/adicionales/fabricas/datos-adicional';
import { RegistrarAdicionalUseCase } from './registrar-adicional.use-case';

const ADMINISTRADOR = 7;

describe('RegistrarAdicionalUseCase', () => {
  let adicionales: EnMemoriaAdicionalRepository;
  let reloj: RelojDePrueba;
  let registrar: RegistrarAdicionalUseCase;

  beforeEach(() => {
    adicionales = new EnMemoriaAdicionalRepository();
    reloj = new RelojDePrueba();
    registrar = new RegistrarAdicionalUseCase(adicionales, reloj);
  });

  it('lo crea activo y lo devuelve con su precio en soles', async () => {
    const creado = await registrar.ejecutar(
      unAdicionalValido({ precio: '45' }),
      ADMINISTRADOR,
    );

    expect(creado).toEqual({
      id: 1,
      nombre: 'Balón',
      descripcion: 'N.º 5, cuero sintético.',
      precio: '45.00',
      estado: 'ACTIVO',
      sePuedeEliminar: true,
    });
  });

  it('deja el alta en la auditoría con sus valores, quién y cuándo', async () => {
    await registrar.ejecutar(unAdicionalValido(), ADMINISTRADOR);

    expect(adicionales.auditoria).toEqual([
      {
        accion: 'ALTA',
        nombreDelAdicional: 'Balón',
        detalle: {
          nombre: 'Balón',
          descripcion: 'N.º 5, cuero sintético.',
          precio: '45.00',
        },
        ejecutadoPorId: ADMINISTRADOR,
        ocurridoEn: reloj.ahora(),
      },
    ]);
  });

  it('no lo guarda si otro ya usa el nombre, aunque cambien mayúsculas o tildes', async () => {
    await registrar.ejecutar(
      unAdicionalValido({ nombre: 'Balón' }),
      ADMINISTRADOR,
    );

    const error = await registrar
      .ejecutar(unAdicionalValido({ nombre: 'BALON' }), ADMINISTRADOR)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictoError);
    expect((error as ConflictoError).errores).toEqual({
      nombre: 'Ya existe un adicional llamado «BALON».',
    });
    expect(await adicionales.listar()).toHaveLength(1);
  });

  it('con un precio de cero no guarda nada y dice por qué', async () => {
    const error = await registrar
      .ejecutar(unAdicionalValido({ precio: '0' }), ADMINISTRADOR)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ReglaInvalidaError);
    expect((error as ReglaInvalidaError).errores).toEqual({
      precio: 'El monto debe ser mayor que cero.',
    });
    expect(adicionales.auditoria).toEqual([]);
  });
});
