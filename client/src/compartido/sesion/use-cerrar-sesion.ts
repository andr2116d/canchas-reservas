"use client";

import { useState } from "react";
import { cerrarSesion } from "./sesion.api";
import { salirDelPanel } from "./use-vigencia-de-sesion";

/** Cierra la sesión y sale del panel; si falla, deja el error para mostrarlo. */
export function useCerrarSesion() {
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState(false);

  async function cerrar() {
    setError(false);
    setCerrando(true);
    try {
      await cerrarSesion();
      salirDelPanel();
    } catch {
      setError(true);
      setCerrando(false);
    }
  }

  return { cerrar, cerrando, error };
}
