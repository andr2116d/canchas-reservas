import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mapaDePrueba } from "../../../../test/features/disponibilidad/mapa-de-prueba";
import { consultarMapa } from "../servicios/disponibilidad.api";
import { ProximosTurnos, proximosLibres } from "./proximos-turnos";

vi.mock("../servicios/disponibilidad.api", () => ({ consultarMapa: vi.fn() }));

describe("ProximosTurnos", () => {
  it("toma el primer turno libre de cada tipo de cancha", () => {
    expect(proximosLibres(mapaDePrueba())).toEqual([{ tipo: "FUTBOL_5", desde: "17:00", cancha: "Cancha 1", precio: "60.00" }]);
  });

  it("muestra los próximos turnos de hoy y lleva al mapa", async () => {
    vi.mocked(consultarMapa).mockResolvedValue({ tipo: "consultado", mapa: mapaDePrueba() });
    render(<ProximosTurnos />);

    expect(await screen.findByRole("link", { name: /17:00/ })).toHaveAttribute("href", "#turnos");
  });

  it("si hoy no quedan turnos libres no muestra nada", async () => {
    vi.mocked(consultarMapa).mockResolvedValue({ tipo: "consultado", mapa: mapaDePrueba({ tipos: [] }) });
    const { container } = render(<ProximosTurnos />);

    await vi.waitFor(() => expect(consultarMapa).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
