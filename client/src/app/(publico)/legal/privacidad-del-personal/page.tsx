import type { Metadata } from "next";
import { AvisoDePrivacidadDelPersonal } from "@/features/legal/componentes/aviso-de-privacidad-del-personal";

export const metadata: Metadata = { title: "Aviso de privacidad del personal · La Previa" };

export default function PaginaDelAvisoDePrivacidadDelPersonal() {
  return (
    <main className="marco-interno px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/80 bg-papel p-6 shadow-sm sm:p-10">
        <AvisoDePrivacidadDelPersonal />
      </div>
    </main>
  );
}
