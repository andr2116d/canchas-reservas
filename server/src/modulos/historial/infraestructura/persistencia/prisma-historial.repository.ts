import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import { Prisma } from '../../../../generated/prisma/client';
import type { Accion, Categoria } from '../../dominio/categorias-del-historial';
import type { FiltroDelHistorial } from '../../dominio/filtro-del-historial';
import type {
  Autor,
  HistorialRepository,
  RegistroGuardado,
} from '../../dominio/historial.repository';

interface FilaDelHistorial {
  id: string;
  ocurrido_en: Date;
  ejecutado_por_id: number;
  categoria: Categoria;
  accion: Accion;
  sujeto: string | null;
  sujeto_usuario_id: number | null;
  detalle: unknown;
  importante: boolean;
}

/** Cada filtro, con sus valores como parámetros: nunca se concatenan al SQL. */
function condiciones(filtro: FiltroDelHistorial): Prisma.Sql {
  const partes: Prisma.Sql[] = [];
  if (filtro.autorId !== undefined)
    partes.push(Prisma.sql`ejecutado_por_id = ${filtro.autorId}`);
  if (filtro.categoria)
    partes.push(Prisma.sql`categoria = ${filtro.categoria}`);
  if (filtro.accion) partes.push(Prisma.sql`accion = ${filtro.accion}`);
  if (filtro.desde) partes.push(Prisma.sql`ocurrido_en >= ${filtro.desde}`);
  if (filtro.antesDe) partes.push(Prisma.sql`ocurrido_en < ${filtro.antesDe}`);
  if (filtro.soloImportantes) partes.push(Prisma.sql`importante`);
  return partes.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(partes, ' AND ')}`
    : Prisma.empty;
}

/** Lee la vista `historial_de_cambios`, que solo admite consultas. */
@Injectable()
export class PrismaHistorialRepository implements HistorialRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async buscar(
    filtro: FiltroDelHistorial,
  ): Promise<{ registros: RegistroGuardado[]; total: number }> {
    const donde = condiciones(filtro);
    const orden =
      filtro.orden === 'RECIENTES'
        ? Prisma.sql`ORDER BY ocurrido_en DESC, id DESC`
        : Prisma.sql`ORDER BY ocurrido_en ASC, id ASC`;
    const [filas, [{ total }]] = await Promise.all([
      this.prisma.$queryRaw<FilaDelHistorial[]>`
        SELECT * FROM historial_de_cambios ${donde} ${orden}
        LIMIT ${filtro.porPagina} OFFSET ${(filtro.pagina - 1) * filtro.porPagina}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT count(*)::int AS total FROM historial_de_cambios ${donde}`,
    ]);
    const nombres = await this.nombres(
      filas.flatMap((f) =>
        [f.ejecutado_por_id, f.sujeto_usuario_id ?? []].flat(),
      ),
    );
    return {
      registros: filas.map((fila) => ({
        id: fila.id,
        ocurridoEn: fila.ocurrido_en,
        categoria: fila.categoria,
        accion: fila.accion,
        importante: fila.importante,
        autor: {
          id: fila.ejecutado_por_id,
          nombre: nombres.get(fila.ejecutado_por_id)!.nombre,
        },
        sujeto:
          fila.sujeto_usuario_id === null
            ? fila.sujeto
            : (nombres.get(fila.sujeto_usuario_id)?.nombre ?? null),
        detalle: fila.detalle,
      })),
      total,
    };
  }

  async autores(): Promise<Autor[]> {
    const filas = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT DISTINCT ejecutado_por_id AS id FROM historial_de_cambios`;
    const nombres = await this.nombres(filas.map((f) => f.id));
    return [...nombres.values()]
      .filter((autor): autor is Autor => autor.rol !== 'JUGADOR')
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  /** Nombres y apellidos descifrados de las cuentas que aparecen en la página. */
  private async nombres(
    ids: number[],
  ): Promise<Map<number, Omit<Autor, 'rol'> & { rol: string }>> {
    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: {
        id: true,
        rol: true,
        nombresCifrado: true,
        apellidosCifrado: true,
      },
    });
    return new Map(
      usuarios.map((u) => [
        u.id,
        {
          id: u.id,
          rol: u.rol,
          nombre: [u.nombresCifrado, u.apellidosCifrado]
            .map((valor) => this.cifrador.descifrar(valor))
            .join(' '),
        },
      ]),
    );
  }
}
