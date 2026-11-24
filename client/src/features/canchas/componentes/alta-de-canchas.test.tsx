import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registrarCanchas } from "../servicios/canchas.api";
import { AltaDeCanchas, type AltaDeCanchasProps } from "./alta-de-canchas";
import { ProveedorDeAvisos } from "./avisos-de-canchas";

vi.mock("../servicios/canchas.api", () => ({ registrarCanchas: vi.fn() }));

function mostrar(props: Partial<AltaDeCanchasProps> = {}) {
  const alCrear = vi.fn();
  render(
    <ProveedorDeAvisos>
      <AltaDeCanchas existentes={[]} tiposSinTarifa={[]} alCrear={alCrear} {...props} />
    </ProveedorDeAvisos>,
  );
  return { usuario: userEvent.setup(), alCrear };
}

describe("AltaDeCanchas", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("la primera vez guía con pasos y propone varias canchas con nombres", () => {
    mostrar();

    expect(screen.getByRole("heading", { name: "Agrega las canchas del local" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1 Cuántas de cada tamaño" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de la cancha 1 de fútbol 5")).toHaveValue("Cancha 1");
    expect(screen.getByLabelText("Nombre de la cancha 2 de fútbol 5")).toHaveValue("Cancha 2");
    expect(screen.getByRole("heading", { name: "Así quedarán" })).toBeInTheDocument();
  });

  it("crea varias de cada tamaño, con nombres que siguen a los existentes", async () => {
    vi.mocked(registrarCanchas).mockResolvedValue({ tipo: "creadas", canchas: [{ id: 4 }, { id: 5 }, { id: 6 }] as never });
    const { usuario, alCrear } = mostrar({ existentes: ["Cancha 1", "Cancha 2"] });

    await usuario.click(screen.getByRole("button", { name: "Varias a la vez" }));
    await usuario.click(screen.getByRole("button", { name: "Una más de fútbol 7" }));
    await usuario.click(screen.getByRole("button", { name: "Con luz" }));
    await usuario.click(screen.getByRole("button", { name: "Bancas" }));
    await usuario.click(screen.getByRole("button", { name: "Agregar 3 canchas" }));

    const comun = { tieneIluminacion: true, caracteristicas: ["BANCAS"] };
    expect(registrarCanchas).toHaveBeenCalledWith([
      { nombre: "Cancha 3", tipo: "FUTBOL_5", ...comun },
      { nombre: "Cancha 4", tipo: "FUTBOL_5", ...comun },
      { nombre: "Cancha 5", tipo: "FUTBOL_7", ...comun },
    ]);
    expect(alCrear).toHaveBeenCalledWith([4, 5, 6]);
    expect(await screen.findByRole("status")).toHaveTextContent("Se agregaron 3 canchas, todas operativas.");
  });

  it("pide la luz y marca los nombres repetidos sin llamar al server", async () => {
    const { usuario } = mostrar();
    const segunda = screen.getByLabelText("Nombre de la cancha 2 de fútbol 5");
    await usuario.clear(segunda);
    await usuario.type(segunda, "cancha  1");

    await usuario.click(screen.getByRole("button", { name: "Agregar 2 canchas" }));

    expect(screen.getByText("Indica si tienen luz para jugar de noche.")).toBeInTheDocument();
    expect(segunda).toHaveAttribute("aria-invalid", "true");
    expect(registrarCanchas).not.toHaveBeenCalled();
  });

  it("muestra junto a cada nombre el error que devuelve el server", async () => {
    vi.mocked(registrarCanchas).mockResolvedValue({
      tipo: "datos-rechazados",
      errores: { "canchas.1.nombre": "Ya existe una cancha llamada «Cancha 2»." },
    });
    const { usuario } = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Sin luz" }));
    await usuario.click(screen.getByRole("button", { name: "Agregar 2 canchas" }));

    expect(await screen.findByText("Ya existe una cancha llamada «Cancha 2».")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de la cancha 2 de fútbol 5")).toHaveAttribute("aria-invalid", "true");
  });

  it("crea una sola cancha y dice qué falta antes de enviarla", async () => {
    vi.mocked(registrarCanchas).mockResolvedValue({ tipo: "creadas", canchas: [{ id: 9 }] as never });
    const { usuario, alCrear } = mostrar({ existentes: ["Cancha 1"] });

    await usuario.click(screen.getByRole("button", { name: "Una" }));
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Cancha 2");
    await usuario.click(screen.getByRole("button", { name: "Agregar cancha" }));
    expect(screen.getByText("Elige si es de fútbol 5 o de fútbol 7.")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Fútbol 7" }));
    await usuario.click(screen.getByRole("button", { name: "Sin luz" }));
    await usuario.click(screen.getByRole("button", { name: "Agregar cancha" }));

    expect(registrarCanchas).toHaveBeenCalledWith([
      { nombre: "Cancha 2", tipo: "FUTBOL_7", tieneIluminacion: false, caracteristicas: [] },
    ]);
    expect(alCrear).toHaveBeenCalledWith([9]);
  });

  it("avisa si el tamaño elegido aún no tiene tarifa", async () => {
    const { usuario } = mostrar({ tiposSinTarifa: ["FUTBOL_7"] });

    await usuario.click(screen.getByRole("button", { name: "Una más de fútbol 7" }));

    expect(screen.getByText(/Fútbol 7 aún no tiene tarifa/)).toBeInTheDocument();
  });
});
