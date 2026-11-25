import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import type {
  EstadoDelFiltro,
  FiltroDeHojas,
} from '../../../src/modulos/reclamos/dominio/filtro-de-hojas';
import { HojaDeReclamacion } from '../../../src/modulos/reclamos/dominio/hoja-de-reclamacion.entity';
import type {
  Autoria,
  CambioDeLaHoja,
  CambioRegistrado,
  HojaRepository,
  PaginaDeHojas,
  RegistroDeHoja,
} from '../../../src/modulos/reclamos/dominio/hoja.repository';
import { NumeroDeHoja } from '../../../src/modulos/reclamos/dominio/numero-de-hoja.value-object';

interface HojaGuardada extends RegistroDeHoja {
  numero: NumeroDeHoja;
  hoja: HojaDeReclamacion;
}

const mismoNumero = (a: NumeroDeHoja, b: NumeroDeHoja) =>
  a.anio === b.anio && a.correlativo === b.correlativo;

const copia = (hoja: HojaDeReclamacion) =>
  HojaDeReclamacion.restaurar(hoja.id ?? 0, hoja.numero!, hoja.datos);

function cumpleEstado(
  hoja: HojaDeReclamacion,
  estado: EstadoDelFiltro,
  hoy: string,
) {
  const porResponder = hoja.estado !== 'RESPONDIDA';
  if (estado === 'TODAS') return true;
  if (estado === 'POR_RESPONDER') return porResponder;
  if (estado === 'VENCIDAS') return porResponder && hoja.fechaLimite < hoy;
  return hoja.estado === estado;
}

/** Hojas en memoria con las mismas reglas que la base: numeración por año y auditoría. */
export class EnMemoriaHojaRepository implements HojaRepository {
  readonly guardadas: HojaGuardada[] = [];
  readonly auditoria: (CambioDeLaHoja & { hojaId: number })[] = [];

  registrar(
    hoja: HojaDeReclamacion,
    registro: RegistroDeHoja,
  ): Promise<NumeroDeHoja> {
    const anio = Number(fechaEnLima(hoja.registradaEn).slice(0, 4));
    const delAnio = this.guardadas.filter((g) => g.numero.anio === anio).length;
    const numero = NumeroDeHoja.de(anio, delAnio + 1);
    const guardada = HojaDeReclamacion.restaurar(
      this.guardadas.length + 1,
      numero,
      hoja.datos,
    );
    this.guardadas.push({ ...registro, numero, hoja: guardada });
    return Promise.resolve(numero);
  }

  buscarPorSeguimiento(numero: NumeroDeHoja, codigo: string) {
    const g = this.guardadas.find(
      (x) => mismoNumero(x.numero, numero) && x.codigo === codigo,
    );
    return Promise.resolve(g && copia(g.hoja));
  }

  delTitular(titularId: number) {
    return Promise.resolve(
      this.guardadas
        .filter((g) => g.titularId === titularId)
        .map((g) => copia(g.hoja))
        .reverse(),
    );
  }

  buscarDelTitular(titularId: number, numero: NumeroDeHoja) {
    const g = this.guardadas.find(
      (x) => x.titularId === titularId && mismoNumero(x.numero, numero),
    );
    return Promise.resolve(g && copia(g.hoja));
  }

  listar(filtro: FiltroDeHojas, hoy: string): Promise<PaginaDeHojas> {
    const conOtrosFiltros = this.guardadas
      .map((g) => g.hoja)
      .filter(
        (h) =>
          (!filtro.tipo || h.tipo === filtro.tipo) &&
          (!filtro.motivo || (h.motivo ?? 'SIN_MOTIVO') === filtro.motivo) &&
          (!filtro.numero || mismoNumero(h.numero!, filtro.numero)) &&
          (!filtro.desde || h.registradaEn >= filtro.desde) &&
          (!filtro.antesDe || h.registradaEn < filtro.antesDe),
      );
    const estados = [
      'POR_RESPONDER',
      'NUEVA',
      'EN_ATENCION',
      'VENCIDAS',
      'RESPONDIDA',
      'TODAS',
    ] as const;
    const conteos = Object.fromEntries(
      estados.map((e) => [
        e,
        conOtrosFiltros.filter((h) => cumpleEstado(h, e, hoy)).length,
      ]),
    ) as Record<EstadoDelFiltro, number>;
    const ordenadas = conOtrosFiltros
      .filter((h) => cumpleEstado(h, filtro.estado, hoy))
      .sort((a, b) => {
        if (filtro.orden === 'RECIENTES')
          return b.registradaEn.getTime() - a.registradaEn.getTime();
        if (filtro.orden === 'ANTIGUAS')
          return a.registradaEn.getTime() - b.registradaEn.getTime();
        const porFecha = (h: HojaDeReclamacion) =>
          h.respuesta?.respondidaEn.getTime() ?? Infinity;
        return (
          porFecha(b) - porFecha(a) ||
          a.fechaLimite.localeCompare(b.fechaLimite) ||
          a.id! - b.id!
        );
      });
    const inicio = (filtro.pagina - 1) * filtro.porPagina;
    return Promise.resolve({
      hojas: ordenadas.slice(inicio, inicio + filtro.porPagina).map(copia),
      total: ordenadas.length,
      conteos,
    });
  }

  buscar(numero: NumeroDeHoja) {
    const g = this.guardadas.find((x) => mismoNumero(x.numero, numero));
    return Promise.resolve(g && copia(g.hoja));
  }

  registrarApertura(
    hoja: HojaDeReclamacion,
    autoria: Autoria,
  ): Promise<boolean> {
    const g = this.guardadas.find((x) => x.hoja.id === hoja.id)!;
    if (!g.hoja.abrir(autoria.ocurridoEn)) return Promise.resolve(false);
    this.auditoria.push({ ...autoria, accion: 'APERTURA', hojaId: hoja.id! });
    return Promise.resolve(true);
  }

  guardar(hoja: HojaDeReclamacion, cambio: CambioDeLaHoja): Promise<void> {
    const g = this.guardadas.find((x) => x.hoja.id === hoja.id)!;
    g.hoja = copia(hoja);
    this.auditoria.push({ ...cambio, hojaId: hoja.id! });
    return Promise.resolve();
  }

  titularDe(hoja: HojaDeReclamacion): Promise<number | null> {
    return Promise.resolve(
      this.guardadas.find((g) => g.hoja.id === hoja.id)?.titularId ?? null,
    );
  }

  cambiosDe(hoja: HojaDeReclamacion): Promise<CambioRegistrado[]> {
    return Promise.resolve(
      this.auditoria
        .filter((c) => c.hojaId === hoja.id)
        .map((c) => ({
          accion: c.accion,
          ejecutadoPor: `Persona ${c.ejecutadoPorId}`,
          ocurridoEn: c.ocurridoEn,
          detalle: c.detalle ?? null,
        })),
    );
  }
}
