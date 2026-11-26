import {
  enSoles,
  type LineaDeDetalle,
  rangoEnLima,
  tamanoLegible,
} from './linea-de-detalle';

type Cambio<T> = { antes: T; despues: T };

const DETALLE_DE_CANCHA: Record<string, string> = {
  TECHADA: 'Techada',
  BANCAS: 'Bancas',
  JUNTO_A_LA_PARED: 'Junto a la pared',
  GRADERIAS: 'Graderías',
  MALLA_ALTA: 'Malla alta',
  VESTUARIO_CERCA: 'Vestuario cerca',
};

const texto = (valor: unknown): string | null =>
  typeof valor === 'string' || typeof valor === 'number' ? String(valor) : null;
const precio = (valor: unknown): string | null =>
  typeof valor === 'string' ? enSoles(valor) : null;

/** Cómo escribir cada dato de una cancha, en el orden en que se muestra. */
const CAMPOS_DE_CANCHA: [string, string, (valor: unknown) => string | null][] =
  [
    ['nombre', 'Nombre', texto],
    [
      'tipo',
      'Tamaño',
      (v) => (typeof v === 'string' ? tamanoLegible(v) : null),
    ],
    ['tieneIluminacion', 'Iluminación', (v) => (v ? 'Con luz' : 'Sin luz')],
    [
      'caracteristicas',
      'Detalles',
      (v) => {
        const lista = (v as string[]).map((c) => DETALLE_DE_CANCHA[c] ?? c);
        return lista.length > 0 ? lista.join(', ') : 'Ninguno';
      },
    ],
    ['nota', 'Nota', texto],
  ];

const CAMPOS_DE_ADICIONAL: [
  string,
  string,
  (valor: unknown) => string | null,
][] = [
  ['nombre', 'Nombre', texto],
  ['descripcion', 'Descripción', texto],
  ['precio', 'Precio por unidad', precio],
];

function lineasDeCambios(
  campos: [string, string, (valor: unknown) => string | null][],
  cambios: Record<string, Cambio<unknown> | undefined>,
): LineaDeDetalle[] {
  return campos.flatMap(([clave, campo, escribir]) => {
    const cambio = cambios[clave];
    return cambio
      ? [
          {
            campo,
            antes: escribir(cambio.antes),
            despues: escribir(cambio.despues),
          },
        ]
      : [];
  });
}

export function detalleDeCancha(
  cambios: Record<string, Cambio<unknown>>,
): LineaDeDetalle[] {
  return lineasDeCambios(CAMPOS_DE_CANCHA, cambios);
}

export function detalleDeBloqueo({
  tipo,
  inicio,
  fin,
}: {
  tipo: string;
  inicio: string;
  fin: string;
}): LineaDeDetalle[] {
  return [
    {
      campo: 'Tipo',
      antes: null,
      despues: tipo === 'EMERGENCIA' ? 'Emergencia' : 'Programado',
    },
    { campo: 'Rango', antes: null, despues: rangoEnLima(inicio, fin) },
  ];
}

/** En un alta, el precio con que se creó (y la descripción si tiene); en una edición, lo que cambió. */
export function detalleDeAdicional(
  accion: string,
  detalle: Record<string, unknown>,
): LineaDeDetalle[] {
  if (accion === 'ALTA') {
    const lineas: LineaDeDetalle[] = [
      {
        campo: 'Precio por unidad',
        antes: null,
        despues: precio(detalle.precio),
      },
    ];
    if (detalle.descripcion)
      lineas.push({
        campo: 'Descripción',
        antes: null,
        despues: texto(detalle.descripcion),
      });
    return lineas;
  }
  return lineasDeCambios(
    CAMPOS_DE_ADICIONAL,
    detalle as Record<string, Cambio<unknown>>,
  );
}
