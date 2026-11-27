import { describe, expect, it } from "vitest";
import { describirAviso } from "./avisos";

describe("describirAviso", () => {
  it("una reserva nueva lleva a recepción a su mapa de turnos y a administración al historial de reservas", () => {
    const aviso = { tipo: "NUEVA_RESERVA", referencia: "7K3Q9X" } as const;

    expect(describirAviso(aviso, "RECEPCIONISTA")).toEqual({ titulo: "Nueva reserva 7K3Q9X", enlace: "/recepcion/disponibilidad" });
    expect(describirAviso(aviso, "ADMINISTRADOR")).toEqual({
      titulo: "Nueva reserva 7K3Q9X",
      enlace: "/administracion/historial?categoria=RESERVAS",
    });
  });

  it("los reclamos siguen llevando a su hoja", () => {
    expect(describirAviso({ tipo: "NUEVO_RECLAMO", referencia: "000014-2026" }, "ADMINISTRADOR").enlace).toBe("/administracion/reclamos/000014-2026");
    expect(describirAviso({ tipo: "RECLAMO_RESPONDIDO", referencia: "000014-2026" }, "JUGADOR").enlace).toBe("/inicio/reclamos/000014-2026");
  });
});
