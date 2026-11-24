"use client";

import { useState } from "react";
import { useAvisar } from "../componentes/avisos-de-canchas";
import { registrarCanchas } from "../servicios/canchas.api";
import type { DatosDeCancha } from "../servicios/canchas";
import { nombresSugeridos } from "../utilidades/nombres-sugeridos";
import {
  type AltaEnGrupo,
  type AltaIndividual,
  canchasPropuestas,
  erroresDelServer,
  prepararGrupo,
  prepararIndividual,
} from "../utilidades/preparar-alta";

export type ModoDeAlta = "una" | "varias";

const INDIVIDUAL_VACIA: AltaIndividual = { nombre: "", tipo: null, tieneIluminacion: null, caracteristicas: [] };
const GRUPO_INICIAL: AltaEnGrupo = { cantidad: { FUTBOL_5: 2, FUTBOL_7: 0 }, tieneIluminacion: null, caracteristicas: [], nombres: {} };

const textoDelAlta = (lista: DatosDeCancha[]) =>
  lista.length > 1 ? `Se agregaron ${lista.length} canchas, todas operativas.` : `${lista[0].nombre} se agregó, operativa.`;

/**
 * Alta de una cancha o de varias a la vez. La primera vez empieza en «varias»,
 * porque un local nuevo suele registrar todas sus canchas juntas.
 */
export function useAltaDeCanchas(existentes: string[], alCrear: (ids: number[]) => void) {
  const avisar = useAvisar();
  const [modo, setModo] = useState<ModoDeAlta>(existentes.length === 0 ? "varias" : "una");
  const [individual, setIndividual] = useState<AltaIndividual>(INDIVIDUAL_VACIA);
  // Hasta que se escribe, el nombre de la cancha individual es el sugerido.
  const [nombreEscrito, setNombreEscrito] = useState<string | null>(null);
  const [grupo, setGrupo] = useState<AltaEnGrupo>(GRUPO_INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const nombreSugerido = nombresSugeridos(existentes, 1)[0];
  const individualConNombre = { ...individual, nombre: nombreEscrito ?? nombreSugerido };
  const propuestas = canchasPropuestas(grupo, existentes);

  async function enviar() {
    const { lista, errores: deFormato } = modo === "una" ? prepararIndividual(individualConNombre) : prepararGrupo(grupo, existentes);
    setErrores(deFormato);
    if (!lista) return;
    setEnviando(true);
    const resultado = await registrarCanchas(lista);
    setEnviando(false);
    if (resultado.tipo === "creadas") {
      avisar(textoDelAlta(lista));
      setIndividual(INDIVIDUAL_VACIA);
      setNombreEscrito(null);
      setGrupo(GRUPO_INICIAL);
      alCrear(resultado.canchas.map((cancha) => cancha.id));
    } else if (resultado.tipo === "datos-rechazados") {
      setErrores(erroresDelServer(resultado.errores, modo === "varias" ? propuestas : undefined));
    } else setErrores({ general: resultado.mensaje });
  }

  const elegirModo = (nuevo: ModoDeAlta) => {
    setModo(nuevo);
    setErrores({});
  };
  const cambiarIndividual = ({ nombre, ...cambios }: Partial<AltaIndividual>) => {
    if (nombre !== undefined) setNombreEscrito(nombre);
    setIndividual((actual) => ({ ...actual, ...cambios }));
  };
  const cambiarGrupo = (cambios: Partial<AltaEnGrupo>) => setGrupo((actual) => ({ ...actual, ...cambios }));

  return { modo, elegirModo, individual: individualConNombre, cambiarIndividual, grupo, cambiarGrupo, propuestas, errores, enviando, enviar };
}
