import type { Metadata } from "next";
import { DocumentoLegal } from "@/features/legal/componentes/documento-legal";
import { APARTADOS_DE_LAS_COOKIES, VIGENCIA_DE_LAS_COOKIES } from "@/features/legal/documentos/cookies";

export const metadata: Metadata = { title: "Política de cookies · La Previa" };

export default function PaginaDeCookies() {
  return <DocumentoLegal titulo="Política de cookies" resumen="Qué cookies usa la web, para qué y cómo cambias tu elección." vigenteDesde={VIGENCIA_DE_LAS_COOKIES} apartados={APARTADOS_DE_LAS_COOKIES} />;
}
