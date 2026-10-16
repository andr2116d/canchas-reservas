"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useCerrarSesion, useSesion } from "@/features/auth/hooks";
import { RUTA_PANEL } from "@/features/auth/roles";
import { Logo } from "./logo";
import { MENU_ROL, enlaceActivo } from "./menu-rol";

export function BarraSuperior() {
  const pathname = usePathname();
  const { data: sesion } = useSesion();
  const cerrar = useCerrarSesion();

  if (!sesion) return null;

  const enlaces = MENU_ROL[sesion.rol];
  const activo = enlaceActivo(enlaces, pathname);

  return (
    <header className="bg-noche-900 text-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-6 px-4 md:px-6">
        <Link href={RUTA_PANEL[sesion.rol]} aria-label="Ir a mi panel" className="py-3">
          <Logo className="text-[28px] leading-7" />
        </Link>
        <nav aria-label="Menú principal" className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              aria-current={enlace === activo ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium hover:bg-white/10",
                enlace === activo && "bg-white/10",
              )}
            >
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm md:inline">{sesion.nombres}</span>
          <Button
            variante="fantasma"
            className="min-h-11 text-white hover:bg-white/10"
            cargando={cerrar.isPending}
            onClick={() => cerrar.mutate()}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
      {cerrar.isError && (
        <p role="alert" className="bg-error-fondo px-4 py-2 text-center text-sm text-error">
          No se pudo cerrar la sesión. Intenta de nuevo.
        </p>
      )}
    </header>
  );
}
