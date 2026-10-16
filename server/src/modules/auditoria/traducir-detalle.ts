export type ValorCambio = string | number | boolean | null;

export interface Cambio {
  campo: string;
  anterior: ValorCambio;
  nuevo: ValorCambio;
}

export interface Nombres {
  cancha(id: number): string;
  reserva(id: number): string;
}

type Objeto = Record<string, unknown>;

export const SIN_NOMBRES: Nombres = {
  cancha: (id) => `Cancha #${id}`,
  reserva: (id) => `Reserva #${id}`,
};

const CAMPOS_DINERO = new Set([
  'valor',
  'precio',
  'valorTurno',
  'adelantoMinimo',
  'creditoAplicado',
  'monto',
  'importe',
]);
const CAMPOS_OMITIDOS = new Set(['id']);

const esObjeto = (valor: unknown): valor is Objeto =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor);

function primitivo(valor: unknown): ValorCambio {
  if (valor === undefined || valor === null) return null;
  if (
    typeof valor === 'string' ||
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  ) {
    return valor;
  }
  return JSON.stringify(valor);
}

function normalizar(campo: string, valor: unknown): ValorCambio {
  if (CAMPOS_DINERO.has(campo)) {
    const numero = typeof valor === 'string' ? Number(valor) : valor;
    if (typeof numero === 'number' && Number.isFinite(numero)) {
      return Math.round(numero * 100) / 100;
    }
  }
  return primitivo(valor);
}

function cambio(campo: string, anterior: unknown, nuevo: unknown): Cambio {
  return {
    campo,
    anterior: normalizar(campo, anterior),
    nuevo: normalizar(campo, nuevo),
  };
}

const cambiaron = (lista: Cambio[]) =>
  lista.filter(({ anterior, nuevo }) => anterior !== nuevo);

function anteriorYNuevo(detalle: Objeto): Cambio[] {
  const anterior = esObjeto(detalle.anterior) ? detalle.anterior : {};
  const nuevo = esObjeto(detalle.nuevo) ? detalle.nuevo : {};
  const campos = [
    ...new Set([...Object.keys(nuevo), ...Object.keys(anterior)]),
  ];
  return cambiaron(
    campos
      .filter((campo) => !CAMPOS_OMITIDOS.has(campo))
      .map((campo) => cambio(campo, anterior[campo], nuevo[campo])),
  );
}

function plano(detalle: Objeto, omitir: string[] = []): Cambio[] {
  return cambiaron(
    Object.entries(detalle)
      .filter(([campo]) => !omitir.includes(campo))
      .map(([campo, valor]) => cambio(campo, null, valor)),
  );
}

const tieneAnteriorONuevo = (detalle: Objeto) =>
  esObjeto(detalle.anterior) || esObjeto(detalle.nuevo);

export function cambiosGenericos(detalle: unknown): Cambio[] {
  if (detalle === null || detalle === undefined) return [];
  if (!esObjeto(detalle)) return [cambio('detalle', null, detalle)];
  if (!tieneAnteriorONuevo(detalle)) return plano(detalle);
  return [...anteriorYNuevo(detalle), ...plano(detalle, ['anterior', 'nuevo'])];
}

function cancha(detalle: Objeto): Cambio[] {
  const borrados = ['tarifasBorradas', 'bloqueosBorrados'].filter(
    (campo) => typeof detalle[campo] === 'number' && detalle[campo] > 0,
  );
  return [
    ...anteriorYNuevo(detalle),
    ...borrados.map((campo) => cambio(campo, null, detalle[campo])),
  ];
}

function tarifa(detalle: Objeto): Cambio[] {
  return anteriorYNuevo(detalle);
}

function horarioDelDia(dia: unknown): string {
  if (!esObjeto(dia)) throw new Error('Día de horario inválido');
  const { abierto, apertura, cierre } = dia;
  return abierto === true &&
    typeof apertura === 'string' &&
    typeof cierre === 'string'
    ? `${apertura}-${cierre}`
    : 'CERRADO';
}

function diasPorNumero(lado: unknown) {
  const dias = esObjeto(lado) ? lado.dias : undefined;
  if (dias === undefined) return new Map<number, string>();
  if (!Array.isArray(dias)) throw new Error('Días de horario inválidos');
  return new Map(
    dias.map((dia) => {
      if (!esObjeto(dia) || typeof dia.diaSemana !== 'number') {
        throw new Error('Día de horario inválido');
      }
      return [dia.diaSemana, horarioDelDia(dia)] as const;
    }),
  );
}

function horario(detalle: Objeto, nombres: Nombres): Cambio[] {
  const antes = diasPorNumero(detalle.anterior);
  const despues = diasPorNumero(detalle.nuevo);
  const numeros = [...new Set([...antes.keys(), ...despues.keys()])].sort(
    (a, b) => a - b,
  );
  const anterior = esObjeto(detalle.anterior) ? detalle.anterior : {};
  const nuevo = esObjeto(detalle.nuevo) ? detalle.nuevo : {};
  const fuera = detalle.reservasFueraDeHorario;

  return cambiaron([
    ...numeros.map((dia) =>
      cambio(`dia.${dia}`, antes.get(dia) ?? null, despues.get(dia) ?? null),
    ),
    ...('inicioNoche' in nuevo || 'inicioNoche' in anterior
      ? [cambio('inicioNoche', anterior.inicioNoche, nuevo.inicioNoche)]
      : []),
    ...(Array.isArray(fuera) && fuera.length > 0
      ? [
          cambio(
            'reservasFueraDeHorario',
            null,
            fuera.map((id) => nombres.reserva(Number(id))).join(', '),
          ),
        ]
      : []),
  ]);
}

const ORDEN_RESERVA = [
  'canchaId',
  'fecha',
  'horaInicio',
  'valorTurno',
  'adelantoMinimo',
  'creditoAplicado',
];

function reserva(detalle: Objeto, nombres: Nombres): Cambio[] {
  if (tieneAnteriorONuevo(detalle)) return cambiosGenericos(detalle);
  const conocidos = ORDEN_RESERVA.filter((campo) => campo in detalle).map(
    (campo) =>
      campo === 'canchaId'
        ? cambio('cancha', null, nombres.cancha(Number(detalle.canchaId)))
        : cambio(campo, null, detalle[campo]),
  );
  return [
    ...conocidos.filter(
      ({ campo, nuevo }) => !(campo === 'creditoAplicado' && nuevo === 0),
    ),
    ...plano(detalle, ['codigo', ...ORDEN_RESERVA]),
  ];
}

const TRADUCTORES: Record<
  string,
  (detalle: Objeto, nombres: Nombres) => Cambio[]
> = {
  CANCHA: cancha,
  TARIFA: tarifa,
  HORARIO: horario,
  RESERVA: reserva,
};

export function traducirDetalle(
  entidad: string,
  detalle: unknown,
  nombres: Nombres = SIN_NOMBRES,
): Cambio[] {
  const traductor = TRADUCTORES[entidad];
  if (!traductor || !esObjeto(detalle)) return cambiosGenericos(detalle);
  try {
    return traductor(detalle, nombres);
  } catch {
    return cambiosGenericos(detalle);
  }
}
