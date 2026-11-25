import {
  TIPOS_DE_CANCHA,
  type TipoDeCancha,
} from '../../../compartido/dominio/tipo-de-cancha';
import type { AdelantoRepository } from '../../adelanto/api-adelanto';
import type {
  RangoDeCancelacion,
  ReglaDeCancelacionRepository,
} from '../../cancelacion/api-cancelacion';
import {
  DIAS_DE_LA_SEMANA,
  type DiaDeLaSemana,
  type HorarioRepository,
  type HorarioSemanal,
} from '../../horario/api-horario';
import type { TarifaRepository } from '../../tarifas/api-tarifas';
import type {
  AdicionalDelClub,
  CanchaDelClub,
  CatalogoDelClub,
} from './catalogo-del-club.port';

export interface TarifaDelClub {
  tipo: TipoDeCancha;
  precioDia: string;
  precioNoche: string;
  duracionDelTurnoHoras: number;
}

export interface DiaDelClub {
  dia: DiaDeLaSemana;
  abre: string;
  cierra: string;
  inicioDeLaNoche: string;
}

/** Lo que cualquiera puede saber del club. Lo que no se guardó viene vacío: no se inventa. */
export interface ClubPublico {
  canchas: CanchaDelClub[];
  tarifas: TarifaDelClub[];
  /** Solo los días que abre. */
  horario: { dias: DiaDelClub[] } | null;
  adelanto: number | null;
  /** Rangos de la regla vigente, de más a menos anticipación. */
  cancelacion: RangoDeCancelacion[] | null;
  adicionales: AdicionalDelClub[];
}

export interface DependenciasDelClub {
  tarifas: Pick<TarifaRepository, 'vigente'>;
  horarios: Pick<HorarioRepository, 'vigente'>;
  adelantos: Pick<AdelantoRepository, 'vigente'>;
  reglas: Pick<ReglaDeCancelacionRepository, 'vigente'>;
  catalogo: CatalogoDelClub;
}

function diasQueAbre(horario: HorarioSemanal): DiaDelClub[] {
  return DIAS_DE_LA_SEMANA.flatMap((dia) => {
    const delDia = horario.del(dia);
    if (!delDia) return [];
    return [
      {
        dia,
        abre: delDia.abre.texto,
        cierra: delDia.cierra.texto,
        inicioDeLaNoche: horario.inicioDeLaNocheDel(dia).texto,
      },
    ];
  });
}

/** Canchas, precios, horario, adelanto, regla de cancelación y adicionales, para la portada y las páginas legales. */
export class ConsultarElClubUseCase {
  constructor(private readonly de: DependenciasDelClub) {}

  async ejecutar(): Promise<ClubPublico> {
    const [canchas, adicionales, horario, adelanto, regla, tarifas] =
      await Promise.all([
        this.de.catalogo.canchasOperativas(),
        this.de.catalogo.adicionalesActivos(),
        this.de.horarios.vigente(),
        this.de.adelantos.vigente(),
        this.de.reglas.vigente(),
        this.tarifasVigentes(),
      ]);
    return {
      canchas,
      tarifas,
      horario: horario ? { dias: diasQueAbre(horario.horario) } : null,
      adelanto: adelanto?.porcentaje.valor ?? null,
      cancelacion: regla ? [...regla.regla.rangos] : null,
      adicionales,
    };
  }

  private async tarifasVigentes(): Promise<TarifaDelClub[]> {
    const versiones = await Promise.all(
      TIPOS_DE_CANCHA.map((tipo) => this.de.tarifas.vigente(tipo)),
    );
    return versiones.flatMap((version) =>
      version
        ? [
            {
              tipo: version.tarifa.tipo,
              precioDia: version.tarifa.precioDia.enSoles(),
              precioNoche: version.tarifa.precioNoche.enSoles(),
              duracionDelTurnoHoras: version.tarifa.duracion.horas,
            },
          ]
        : [],
    );
  }
}
