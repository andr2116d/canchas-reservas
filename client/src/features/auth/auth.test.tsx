import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BarraSuperior } from "@/components/layout/barra-superior";
import { GuardiaRol } from "./components/guardia-rol";
import { PantallaNoAutorizado } from "./components/pantalla-no-autorizado";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/admin",
}));

function sesion(rol: string) {
  return { id: 1, nombres: "Luis", apellidos: "Paz", correo: "luis@laprevia.pe", rol };
}

function responder(status: number, cuerpo?: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(
      async () => new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status }),
    ),
  );
}

function renderizar(ui: React.ReactNode) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={cliente}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  router.replace.mockReset();
  router.push.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GuardiaRol", () => {
  it("un JUGADOR en /admin va a /no-autorizado y no ve el contenido", async () => {
    responder(200, sesion("JUGADOR"));
    renderizar(
      <GuardiaRol rol="ADMINISTRADOR">
        <p>Contenido de admin</p>
      </GuardiaRol>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/no-autorizado"));
    expect(screen.queryByText("Contenido de admin")).toBeNull();
  });

  it("sin sesión (401) va a /login", async () => {
    responder(401, { statusCode: 401, message: "Sin sesión", errores: {} });
    renderizar(
      <GuardiaRol rol="ADMINISTRADOR">
        <p>Contenido de admin</p>
      </GuardiaRol>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Contenido de admin")).toBeNull();
  });

  it("con el rol correcto muestra el contenido sin redirigir", async () => {
    responder(200, sesion("ADMINISTRADOR"));
    renderizar(
      <GuardiaRol rol="ADMINISTRADOR">
        <p>Contenido de admin</p>
      </GuardiaRol>,
    );
    expect(await screen.findByText("Contenido de admin")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("ante un error 500 muestra el mensaje y no redirige", async () => {
    responder(500, { statusCode: 500, message: "Error interno" });
    renderizar(
      <GuardiaRol rol="ADMINISTRADOR">
        <p>Contenido de admin</p>
      </GuardiaRol>,
    );
    expect((await screen.findByRole("alert")).textContent).toContain("Error interno");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sin conexión muestra el mensaje y no redirige", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fallo")));
    renderizar(
      <GuardiaRol rol="ADMINISTRADOR">
        <p>Contenido de admin</p>
      </GuardiaRol>,
    );
    expect((await screen.findByRole("alert")).textContent).toContain("No se pudo conectar");
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("PantallaNoAutorizado", () => {
  it("muestra el aviso y vuelve al panel del rol", async () => {
    responder(200, sesion("JUGADOR"));
    renderizar(<PantallaNoAutorizado />);
    expect(screen.getByText("Acceso no autorizado")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Volver a mi panel" }));
    expect(router.push).toHaveBeenCalledWith("/jugador");
  });
});

describe("BarraSuperior", () => {
  it("muestra el menú del rol y cierra la sesión", async () => {
    responder(200, sesion("RECEPCIONISTA"));
    renderizar(<BarraSuperior />);
    expect(await screen.findByRole("link", { name: "Agenda" })).toBeTruthy();

    responder(204);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
