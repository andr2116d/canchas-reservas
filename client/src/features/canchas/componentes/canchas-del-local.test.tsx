import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registrarCanchas } from "../servicios/canchas.api";
import type { Cancha } from "../servicios/canchas";
import { CanchasDelLocal } from "./canchas-del-local";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/canchas.api", () => ({ registrarCanchas: vi.fn() }));

function unaCancha(id: number, cambios: Partial<Cancha> = {}): Cancha {
  return {
    id,
    nombre: `Cancha ${id}`,
    tipo: "FUTBOL_5",
    tieneIluminacion: true,
    caracteristicas: [],
    nota: null,
    estado: "OPERATIVA",
    sePuedeEliminar: true,
    ...cambios,
  };
}

describe("CanchasDelLocal", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("sin canchas, el alta ocupa toda la pantalla y no hay filtros", () => {
    render(<CanchasDelLocal canchas={[]} cambios={[]} tiposSinTarifa={[]} hoy="2026-11-24" />);

    expect(screen.getByRole("heading", { name: "Agrega las canchas del local" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Mostrar" })).not.toBeInTheDocument();
  });

  it("filtra por tamaño y por las desactivadas", async () => {
    const usuario = userEvent.setup();
    const canchas = [unaCancha(1), unaCancha(2, { tipo: "FUTBOL_7" }), unaCancha(3, { estado: "DESACTIVADA" })];
    render(<CanchasDelLocal canchas={canchas} cambios={[]} tiposSinTarifa={[]} hoy="2026-11-24" />);

    await usuario.click(screen.getByRole("button", { name: "Fútbol 7 1" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article", { name: "Cancha 2" })).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Desactivadas 1" }));
    expect(screen.getByRole("article", { name: "Cancha 3" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("tras crear las primeras canchas señala dónde quedaron y dónde agregar más", async () => {
    vi.mocked(registrarCanchas).mockResolvedValue({ tipo: "creadas", canchas: [unaCancha(1), unaCancha(2)] });
    const usuario = userEvent.setup();
    const { rerender } = render(<CanchasDelLocal canchas={[]} cambios={[]} tiposSinTarifa={[]} hoy="2026-11-24" />);

    await usuario.click(screen.getByRole("button", { name: "Con luz" }));
    await usuario.click(screen.getByRole("button", { name: "Agregar 2 canchas" }));
    expect(navegar.refresh).toHaveBeenCalled();
    rerender(<CanchasDelLocal canchas={[unaCancha(1), unaCancha(2)]} cambios={[]} tiposSinTarifa={[]} hoy="2026-11-24" />);

    expect(screen.getByText(/Estas son tus canchas/)).toBeInTheDocument();
    expect(screen.getByText("¿Faltan canchas? Agrégalas aquí cuando quieras.")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Entendido" }));
    expect(screen.queryByText(/Estas son tus canchas/)).not.toBeInTheDocument();
  });
});
