"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { Button, Card } from "@/components/ui";
import { RUTA_PANEL } from "../roles";
import { useSesion } from "../hooks";

export function PantallaNoAutorizado() {
  const router = useRouter();
  const { data: sesion, isPending } = useSesion();
  const destino = sesion ? RUTA_PANEL[sesion.rol] : "/login";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <Logo className="text-[28px] leading-7 text-noche-900" />
      <Card className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <h1 className="font-display text-[32px] leading-9 font-bold">Acceso no autorizado</h1>
        <p className="text-texto-suave">No tienes permiso para entrar a esta pantalla.</p>
        <Button disabled={isPending} onClick={() => router.push(destino)}>
          {sesion ? "Volver a mi panel" : "Ir a iniciar sesión"}
        </Button>
      </Card>
    </main>
  );
}
