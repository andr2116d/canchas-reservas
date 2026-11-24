import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { liberarBloqueo, quitarBloqueo } from "../servicios/bloqueos.api";
import type { Bloqueo } from "../servicios/bloqueos";
import { ProveedorDeAvisos } from "./avisos-de-canchas";
import { ListaDeBloqueos } from "./lista-de-bloqueos";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/bloqueos.api", () => ({ liberarBloqueo: vi.fn(), quitarBloqueo: vi.fn() }));

function unBloqueo(cambios: Partial<Bloqueo>): Bloqueo {
  return {
    id: 1,
    canchaId: 1,
    cancha: "La Grande",
    tipo: "EMERGENCIA",
    motivo: "Se rompió un reflector.",
    inicio: "2026-11-24T13:00:00.000Z",
    fin: "2026-11-24T19:00:00.000Z",
    liberado: false,
    etapa: "EN_CURSO",
    ...cambios,
  };
}

const EN_CURSO = unBloqueo({});
const PROXIMO = unBloqueo({ id: 2, cancha: "Cancha 1", tipo: "PROGRAMADO", motivo: "Fumigación.", inicio: "2026-11-28T12:00:00.000Z", fin: "2026-11-28T15:00:00.000Z", etapa: "PROXIMO" });
const TERMINADO = unBloqueo({ id: 3, etapa: "TERMINADO", liberado: true, inicio: "2026-11-20T12:00:00.000Z", fin: "2026-11-20T13:30:00.000Z" });

function mostrar() {
  render(
    <ProveedorDeAvisos>
      <ListaDeBloqueos bloqueos={{ sinTerminar: [EN_CURSO, PROXIMO], terminados: [TERMINADO] }} hoy="2026-11-24" />
    </ProveedorDeAvisos>,
  );
  return userEvent.setup();
}

describe("ListaDeBloqueos", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("agrupa en curso, próximos y terminados plegados, con cancha, rango y motivo", () => {
    mostrar();

    const enCurso = screen.getByRole("region", { name: "En curso" });
    expect(within(enCurso).getByText("La Grande")).toBeInTheDocument();
    expect(within(enCurso).getByText("Hasta 14:00")).toBeInTheDocument();
    const proximos = screen.getByRole("region", { name: "Próximos" });
    expect(within(proximos).getByText("sáb 28 nov, 07:00 – 10:00")).toBeInTheDocument();
    expect(within(proximos).getByText("Fumigación.")).toBeInTheDocument();
    expect(screen.getByText("Terminados (1)")).toBeInTheDocument();
    expect(screen.getByText(/liberado antes/)).toBeInTheDocument();
  });

  it("libera desde ahora uno en curso, tras confirmar", async () => {
    vi.mocked(liberarBloqueo).mockResolvedValue({ tipo: "hecho" });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Liberar desde ahora" }));
    expect(liberarBloqueo).not.toHaveBeenCalled();
    await usuario.click(screen.getByRole("button", { name: "Sí, liberar" }));

    expect(liberarBloqueo).toHaveBeenCalledWith(1);
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
    expect(screen.getByRole("status")).toHaveTextContent("La Grande vuelve a estar disponible.");
  });

  it("quita uno próximo, tras confirmar", async () => {
    vi.mocked(quitarBloqueo).mockResolvedValue({ tipo: "hecho" });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Quitar bloqueo" }));
    await usuario.click(screen.getByRole("button", { name: "Sí, quitar" }));

    expect(quitarBloqueo).toHaveBeenCalledWith(2);
  });
});
