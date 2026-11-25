import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { consultarAvisos, marcarAvisoLeido, marcarTodosLeidos } from "./avisos";
import { CampanaDeAvisos } from "./campana-de-avisos";
import { escucharAvisos } from "./canal-de-avisos";

vi.mock("next/navigation", () => ({ usePathname: () => "/administracion" }));
vi.mock("./canal-de-avisos", () => ({ escucharAvisos: vi.fn(() => () => undefined) }));
vi.mock("./avisos", async (original) => ({
  ...(await original<typeof import("./avisos")>()),
  consultarAvisos: vi.fn(),
  marcarAvisoLeido: vi.fn(() => Promise.resolve({ tipo: "aceptado", cuerpo: undefined })),
  marcarTodosLeidos: vi.fn(() => Promise.resolve({ tipo: "aceptado", cuerpo: undefined })),
}));
const consultar = vi.mocked(consultarAvisos);

const unAviso = (id: number, leido = false) => ({ id, tipo: "NUEVO_RECLAMO" as const, referencia: `00000${id}-2026`, creadoEn: "2026-11-25T15:00:00.000Z", leido });
const conAvisos = (avisos: ReturnType<typeof unAviso>[]) =>
  consultar.mockResolvedValue({ tipo: "aceptado", cuerpo: { avisos, sinLeer: avisos.filter((a) => !a.leido).length } });

describe("CampanaDeAvisos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("dice cuántos avisos hay sin leer y los lista con su enlace", async () => {
    const persona = userEvent.setup();
    conAvisos([unAviso(2), unAviso(1, true)]);
    render(<CampanaDeAvisos />);

    await persona.click(await screen.findByRole("button", { name: "Avisos, 1 sin leer" }));

    const nuevo = screen.getByRole("link", { name: /Nueva hoja de reclamación 000002-2026.*sin leer/ });
    expect(nuevo).toHaveAttribute("href", "/administracion/reclamos/000002-2026");
    expect(screen.getByRole("link", { name: /000001-2026/ })).not.toHaveTextContent("sin leer");
  });

  it("al abrir un aviso lo marca como leído", async () => {
    const persona = userEvent.setup();
    conAvisos([unAviso(2)]);
    render(<CampanaDeAvisos />);
    await persona.click(await screen.findByRole("button", { name: "Avisos, 1 sin leer" }));

    await persona.click(screen.getByRole("link", { name: /000002-2026/ }));

    expect(marcarAvisoLeido).toHaveBeenCalledWith(2);
    expect(screen.getByRole("button", { name: "Avisos" })).toBeInTheDocument();
  });

  it("marca todos como leídos de una vez", async () => {
    const persona = userEvent.setup();
    conAvisos([unAviso(2), unAviso(1)]);
    render(<CampanaDeAvisos />);
    await persona.click(await screen.findByRole("button", { name: "Avisos, 2 sin leer" }));

    await persona.click(screen.getByRole("button", { name: "Marcar todo como leído" }));

    expect(marcarTodosLeidos).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Avisos" })).toBeInTheDocument();
  });

  it("cuando llega uno nuevo por el canal, lo muestra flotando", async () => {
    conAvisos([unAviso(1, true)]);
    render(<CampanaDeAvisos />);
    await screen.findByRole("button", { name: "Avisos" });
    const alLlegar = vi.mocked(escucharAvisos).mock.calls[0][0];

    conAvisos([unAviso(2), unAviso(1, true)]);
    await act(async () => alLlegar());

    const flotante = await screen.findByRole("status");
    expect(flotante).toHaveTextContent("Nueva hoja de reclamación 000002-2026");
    expect(within(flotante).getByRole("link", { name: "Ver" })).toHaveAttribute("href", "/administracion/reclamos/000002-2026");
  });
});
