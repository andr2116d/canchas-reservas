"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { MENU_ROL } from "@/components/layout/menu-rol";
import type { Rol } from "../api";
import { useSesion } from "../hooks";

const TITULO: Record<Rol, string> = {
  ADMINISTRADOR: "Panel de administración",
  RECEPCIONISTA: "Panel de recepción",
  JUGADOR: "Tu panel",
};

export function PanelInicio({ rol }: { rol: Rol }) {
  const { data: sesion } = useSesion();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[32px] leading-9 font-bold">{TITULO[rol]}</h1>
        {sesion && <p className="text-texto-suave">Hola, {sesion.nombres}.</p>}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MENU_ROL[rol].map((enlace) => (
          <li key={enlace.href}>
            <Link href={enlace.href} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-cesped-600">
              <Card className="font-medium hover:bg-fondo">{enlace.etiqueta}</Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
