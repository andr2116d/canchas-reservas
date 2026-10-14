import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function Inicio() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="text-5xl text-noche-900" />
      <p className="max-w-sm text-texto-suave">Reserva tu turno en segundos y juega sin complicarte.</p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-lg bg-cesped-600 px-4 text-sm font-medium text-white hover:bg-cesped-700"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="inline-flex h-10 items-center rounded-lg border border-linea bg-superficie px-4 text-sm font-medium hover:bg-fondo"
        >
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}
