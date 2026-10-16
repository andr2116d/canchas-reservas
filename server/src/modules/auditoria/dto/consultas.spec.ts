import { BadRequestException } from '@nestjs/common';
import { crearValidationPipe } from '../../../common/validacion/validation-pipe';
import { MENSAJE_FECHA } from '../../horario/dto/vista-previa.dto';
import {
  ConsultarAccesosDto,
  MENSAJE_CORREO,
  MENSAJE_EXITO,
} from './consultar-accesos.dto';
import {
  ConsultarAuditoriaDto,
  MENSAJE_ACCION,
  MENSAJE_ENTIDAD,
  MENSAJE_USUARIO,
} from './consultar-auditoria.dto';
import {
  MENSAJE_PAGINA,
  MENSAJE_RANGO,
  MENSAJE_TAMANO,
} from './consulta-paginada.dto';

const pipe = crearValidationPipe();

const validar = (metatype: new () => object, valor: unknown) =>
  pipe.transform(valor, { type: 'query', metatype });

const erroresDe = async (metatype: new () => object, valor: unknown) => {
  const error = await validar(metatype, valor).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(BadRequestException);
  return (
    (error as BadRequestException).getResponse() as {
      errores: Record<string, string>;
    }
  ).errores;
};

describe('Filtros de la consulta de auditoría', () => {
  it('sin filtros usa la página 1 y 20 por página', async () => {
    const dto = (await validar(
      ConsultarAuditoriaDto,
      {},
    )) as ConsultarAuditoriaDto;

    expect(dto).toMatchObject({ pagina: 1, tamano: 20 });
  });

  it('convierte los números de la query', async () => {
    const dto = (await validar(ConsultarAuditoriaDto, {
      entidad: 'CANCHA',
      accion: 'EDITAR',
      usuarioId: '7',
      desde: '2026-10-01',
      hasta: '2026-10-16',
      pagina: '3',
      tamano: '50',
    })) as ConsultarAuditoriaDto;

    expect(dto).toMatchObject({
      entidad: 'CANCHA',
      accion: 'EDITAR',
      usuarioId: 7,
      desde: '2026-10-01',
      hasta: '2026-10-16',
      pagina: 3,
      tamano: 50,
    });
  });

  it('acepta desde igual a hasta', async () => {
    await expect(
      validar(ConsultarAuditoriaDto, {
        desde: '2026-10-16',
        hasta: '2026-10-16',
      }),
    ).resolves.toBeDefined();
  });

  it('rechaza hasta anterior a desde en el campo hasta', async () => {
    expect(
      await erroresDe(ConsultarAuditoriaDto, {
        desde: '2026-10-16',
        hasta: '2026-10-15',
      }),
    ).toEqual({ hasta: MENSAJE_RANGO });
  });

  it('rechaza fechas con otro formato o que no existen', async () => {
    expect(
      await erroresDe(ConsultarAuditoriaDto, {
        desde: '16/10/2026',
        hasta: '2026-02-30',
      }),
    ).toEqual({ desde: MENSAJE_FECHA, hasta: MENSAJE_FECHA });
  });

  it.each([['0'], ['-1'], ['1.5'], ['uno']])(
    'rechaza la página %s',
    async (pagina) => {
      expect(await erroresDe(ConsultarAuditoriaDto, { pagina })).toEqual({
        pagina: MENSAJE_PAGINA,
      });
    },
  );

  it.each([['0'], ['51'], ['diez']])('rechaza el tamaño %s', async (tamano) => {
    expect(await erroresDe(ConsultarAuditoriaDto, { tamano })).toEqual({
      tamano: MENSAJE_TAMANO,
    });
  });

  it('rechaza entidad, acción y usuario mal formados', async () => {
    expect(
      await erroresDe(ConsultarAuditoriaDto, {
        entidad: 'cancha',
        accion: 'EDITAR;',
        usuarioId: '0',
      }),
    ).toEqual({
      entidad: MENSAJE_ENTIDAD,
      accion: MENSAJE_ACCION,
      usuarioId: MENSAJE_USUARIO,
    });
  });

  it('rechaza filtros que no existen', async () => {
    expect(
      await erroresDe(ConsultarAuditoriaDto, { orden: 'asc' }),
    ).toHaveProperty('orden');
  });
});

describe('Filtros de la consulta de accesos', () => {
  it('convierte exito y recorta el correo', async () => {
    const dto = (await validar(ConsultarAccesosDto, {
      exito: 'false',
      correo: '  ana@  ',
    })) as ConsultarAccesosDto;

    expect(dto).toMatchObject({
      exito: false,
      correo: 'ana@',
      pagina: 1,
      tamano: 20,
    });
  });

  it('acepta exito true', async () => {
    const dto = (await validar(ConsultarAccesosDto, {
      exito: 'true',
    })) as ConsultarAccesosDto;

    expect(dto.exito).toBe(true);
  });

  it('rechaza un resultado que no es true ni false', async () => {
    expect(await erroresDe(ConsultarAccesosDto, { exito: 'si' })).toEqual({
      exito: MENSAJE_EXITO,
    });
  });

  it('rechaza un correo de más de 120 caracteres', async () => {
    expect(
      await erroresDe(ConsultarAccesosDto, { correo: 'a'.repeat(121) }),
    ).toEqual({ correo: MENSAJE_CORREO });
  });

  it('valida el rango de fechas igual que la auditoría', async () => {
    expect(
      await erroresDe(ConsultarAccesosDto, {
        desde: '2026-10-16',
        hasta: '2026-10-01',
        tamano: '100',
      }),
    ).toEqual({ hasta: MENSAJE_RANGO, tamano: MENSAJE_TAMANO });
  });
});
