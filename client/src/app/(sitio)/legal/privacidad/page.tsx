import type { Metadata } from "next";
import { DocumentoLegal } from "@/features/legal/componentes/documento-legal";
import { APARTADOS_DE_LA_PRIVACIDAD, VIGENCIA_DE_LA_PRIVACIDAD } from "@/features/legal/documentos/privacidad";

export const metadata: Metadata = { title: "Política de privacidad · La Previa" };

export default function PaginaDePrivacidad() {
  return <DocumentoLegal titulo="Política de privacidad" resumen="Qué datos pedimos, para qué, cómo los cuidamos y cómo ejerces tus derechos." vigenteDesde={VIGENCIA_DE_LA_PRIVACIDAD} apartados={APARTADOS_DE_LA_PRIVACIDAD} />;
}
