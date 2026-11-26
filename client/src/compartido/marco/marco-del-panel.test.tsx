import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarcoDelPanel } from "./marco-del-panel";

vi.mock("next/navigation", () => ({ usePathname: () => "/inicio", redirect: vi.fn() }));
vi.mock("../sesion/sesion.servidor", () => ({
  exigirPanel: async () => ({
    cookie: "sesion=x",
    sesion: { rol: "JUGADOR", requiereCambiarContrasena: false, venceEn: new Date(Date.now() + 60_000).toISOString() },
  }),
}));
vi.mock("../sesion/sesion.api", () => ({ cerrarSesion: vi.fn(), consultarSesion: vi.fn() }));
// Fuera de una petición de Next no hay conexión que esperar.
vi.mock("next/server", () => ({ connection: async () => undefined }));

describe("MarcoDelPanel", () => {
  afterEach(cleanup);

  it("ofrece saltar la barra e ir directo al contenido", async () => {
    render(await MarcoDelPanel({ rol: "JUGADOR", children: <p>Contenido</p> }));

    expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveAttribute("href", "#contenido");
    expect(screen.getByRole("main")).toHaveAttribute("id", "contenido");
  });
});
