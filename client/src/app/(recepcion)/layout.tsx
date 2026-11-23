import { Suspense, type ReactNode } from "react";
import { MarcoDelPanel } from "@/compartido/marco/marco-del-panel";
import { EsperaDeCancha } from "@/compartido/ui/espera-de-cancha";

export default function LayoutDeRecepcion({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<EsperaDeCancha />}>
      <MarcoDelPanel rol="RECEPCIONISTA">{children}</MarcoDelPanel>
    </Suspense>
  );
}
