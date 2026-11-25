"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Abierto, se cierra con Escape (y el foco vuelve al botón), al tocar fuera o al cambiar de página. */
export function useMenuDesplegable() {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const ruta = usePathname();
  const [rutaAlAbrir, setRutaAlAbrir] = useState(ruta);
  if (abierto && ruta !== rutaAlAbrir) {
    setAbierto(false);
    setRutaAlAbrir(ruta);
  }

  useEffect(() => {
    if (!abierto) return;
    const alTocar = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener("pointerdown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  const alternar = () => {
    setRutaAlAbrir(ruta);
    setAbierto(!abierto);
  };
  return { abierto, alternar, cerrarMenu: () => setAbierto(false), contenedor, boton, ruta };
}

