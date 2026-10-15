import type { Prisma } from '../../generated/prisma/client';

const CAMPOS_SENSIBLES = new Set(['passwordHash', 'contrasena']);

type ValorJson = Prisma.InputJsonValue | null;

export type DetalleCambios = {
  anterior: Record<string, ValorJson>;
  nuevo: Record<string, ValorJson>;
};

export function quitarCamposSensibles(valor: ValorJson): ValorJson {
  if (Array.isArray(valor)) {
    return valor.map((item) => quitarCamposSensibles(item as ValorJson));
  }
  if (valor !== null && typeof valor === 'object') {
    const limpio: Record<string, ValorJson> = {};
    for (const [campo, item] of Object.entries(valor)) {
      if (CAMPOS_SENSIBLES.has(campo) || item === undefined) continue;
      limpio[campo] = quitarCamposSensibles(item as ValorJson);
    }
    return limpio;
  }
  return valor;
}

function aJson(valor: unknown): ValorJson {
  if (valor === undefined || valor === null) return null;
  return JSON.parse(JSON.stringify(valor)) as ValorJson;
}

export function detalleCambios(
  anterior: Record<string, unknown>,
  nuevo: Record<string, unknown>,
): DetalleCambios | null {
  const detalle: DetalleCambios = { anterior: {}, nuevo: {} };

  for (const [campo, valorNuevo] of Object.entries(nuevo)) {
    if (CAMPOS_SENSIBLES.has(campo) || valorNuevo === undefined) continue;
    const antes = aJson(anterior[campo]);
    const despues = aJson(valorNuevo);
    if (JSON.stringify(antes) === JSON.stringify(despues)) continue;
    detalle.anterior[campo] = antes;
    detalle.nuevo[campo] = despues;
  }

  return Object.keys(detalle.nuevo).length > 0 ? detalle : null;
}
