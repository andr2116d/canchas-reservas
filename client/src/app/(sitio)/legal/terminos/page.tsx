import type { Metadata } from "next";
import { DocumentoLegal } from "@/features/legal/componentes/documento-legal";
import { APARTADOS_DE_LOS_TERMINOS, VIGENCIA_DE_LOS_TERMINOS } from "@/features/legal/documentos/terminos";

export const metadata: Metadata = { title: "Términos y condiciones · La Previa" };

export default function PaginaDeTerminos() {
  return <DocumentoLegal titulo="Términos y condiciones" resumen="Cómo funciona tu cuenta, cómo se reserva y qué se espera de cada uno, en palabras simples." vigenteDesde={VIGENCIA_DE_LOS_TERMINOS} apartados={APARTADOS_DE_LOS_TERMINOS} />;
}
