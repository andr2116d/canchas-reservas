"use client";

import { OpcionesSegmentadas } from "./opciones-segmentadas";

const OPCIONES = [
  { valor: "DNI", texto: "DNI" },
  { valor: "CARNE_EXTRANJERIA", texto: "Carné de extranjería" },
];

/** Elección entre DNI y carné de extranjería, a un toque y sin lista desplegable. */
export function SelectorTipoDocumento() {
  return <OpcionesSegmentadas nombre="tipoDocumento" leyenda="Tipo de documento" opciones={OPCIONES} />;
}
