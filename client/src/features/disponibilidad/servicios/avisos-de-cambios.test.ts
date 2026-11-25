import { io } from "socket.io-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { escucharCambios } from "./avisos-de-cambios";

const canal = vi.hoisted(() => ({ manejadores: new Map<string, () => void>(), on: vi.fn(), close: vi.fn() }));
vi.mock("socket.io-client", () => ({ io: vi.fn(() => canal) }));

const ocurre = (evento: string) => canal.manejadores.get(evento)?.();

describe("escucharCambios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canal.manejadores.clear();
    canal.on.mockImplementation((evento: string, manejador: () => void) => canal.manejadores.set(evento, manejador));
  });

  it("se conecta al canal del mapa por la ruta de la API", () => {
    escucharCambios({ alCambiar: vi.fn(), alCambiarConexion: vi.fn() });

    expect(io).toHaveBeenCalledWith("/disponibilidad", { path: "/api/tiempo-real" });
  });

  it("avisa cada cambio del server", () => {
    const alCambiar = vi.fn();
    escucharCambios({ alCambiar, alCambiarConexion: vi.fn() });

    ocurre("cambio");

    expect(alCambiar).toHaveBeenCalledTimes(1);
  });

  it("al reconectarse avisa un cambio, por si algo pasó sin conexión", () => {
    const alCambiar = vi.fn();
    const alCambiarConexion = vi.fn();
    escucharCambios({ alCambiar, alCambiarConexion });

    ocurre("connect");
    ocurre("disconnect");
    ocurre("connect");

    expect(alCambiarConexion.mock.calls.map(([estado]) => estado)).toEqual(["conectado", "reconectando", "conectado"]);
    expect(alCambiar).toHaveBeenCalledTimes(1);
  });

  it("deja de escuchar al cerrarse", () => {
    const dejarDeEscuchar = escucharCambios({ alCambiar: vi.fn(), alCambiarConexion: vi.fn() });

    dejarDeEscuchar();

    expect(canal.close).toHaveBeenCalled();
  });
});
