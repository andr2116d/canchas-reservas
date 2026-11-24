// El orden importa: Edge y Opera también dicen «Chrome», y Chrome también dice «Safari».
const NAVEGADORES: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const SISTEMAS: [RegExp, string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X/, 'macOS'],
  [/Linux/, 'Linux'],
];

const buscar = (agente: string, lista: [RegExp, string][]) =>
  lista.find(([patron]) => patron.test(agente))?.[1];

/**
 * Resume el agente del navegador en algo como «Chrome en Windows», para que la
 * persona reconozca sus sesiones. No se guarda el agente completo.
 */
export function resumirDispositivo(agente?: string): string | undefined {
  if (!agente) return undefined;
  const navegador = buscar(agente, NAVEGADORES);
  const sistema = buscar(agente, SISTEMAS);
  if (!navegador) return 'Navegador desconocido';
  return sistema ? `${navegador} en ${sistema}` : navegador;
}
