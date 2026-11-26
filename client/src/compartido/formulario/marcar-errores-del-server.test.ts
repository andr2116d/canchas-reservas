import { describe, expect, it, vi } from "vitest";
import type { UseFormReturn } from "react-hook-form";
import { atenderRechazo } from "./marcar-errores-del-server";

function formularioDePrueba() {
  return { setError: vi.fn(), setFocus: vi.fn() } as unknown as UseFormReturn<{ nombre: string }>;
}

describe("atenderRechazo", () => {
  it("marca los errores por campo, enfoca el primero y no devuelve mensaje", () => {
    const formulario = formularioDePrueba();

    const mensaje = atenderRechazo(formulario, { tipo: "datos-rechazados", errores: { nombre: "Ya existe." } });

    expect(mensaje).toBeUndefined();
    expect(formulario.setError).toHaveBeenCalledWith("nombre", { type: "server", message: "Ya existe." });
    expect(formulario.setFocus).toHaveBeenCalledWith("nombre");
  });

  it("devuelve el mensaje general cuando no es de un campo", () => {
    expect(atenderRechazo(formularioDePrueba(), { tipo: "error", mensaje: "Sin conexión." })).toBe("Sin conexión.");
  });
});
