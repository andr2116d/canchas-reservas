import { Suspense, type ReactNode } from "react";
import { MarcoDelPanel } from "@/compartido/marco/marco-del-panel";
import { EsperaDeCancha } from "@/compartido/ui/espera-de-cancha";

export default function LayoutDeJugador({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<EsperaDeCancha />}>
      <MarcoDelPanel rol="JUGADOR">{children}</MarcoDelPanel>
    </Suspense>
  );
}
