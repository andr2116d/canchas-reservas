import type { Metadata } from "next";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { TARJETA } from "@/compartido/ui/estilos";
import { AvisoDePrivacidadDelPersonal } from "@/features/legal/componentes/aviso-de-privacidad-del-personal";

export const metadata: Metadata = { title: "Aviso de privacidad del personal · La Previa" };

export default function PaginaDelAvisoDePrivacidadDelPersonal() {
  return (
    <div className="marco-interno">
      <main id="contenido" className="contenido-interno">
        <EncabezadoDeSeccion
          titulo="Aviso de privacidad del personal"
          descripcion="Para quienes atienden la recepción y administran La Previa: cómo tratamos tus datos por tu trabajo con nosotros."
        />
        <div className={TARJETA}>
          <AvisoDePrivacidadDelPersonal />
        </div>
      </main>
    </div>
  );
}
