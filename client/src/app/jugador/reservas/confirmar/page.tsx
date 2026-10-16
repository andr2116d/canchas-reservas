import { Suspense } from "react";
import { PantallaConfirmarReserva } from "@/features/reservas/components/confirmar-reserva";

export default function PaginaConfirmarReserva() {
  return (
    <Suspense fallback={<p className="px-4 py-6 text-texto-suave">Cargando…</p>}>
      <PantallaConfirmarReserva />
    </Suspense>
  );
}