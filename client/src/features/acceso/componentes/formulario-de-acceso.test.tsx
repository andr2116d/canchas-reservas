import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { iniciarSesion } from "../servicios/acceso.api";
import { FormularioDeAcceso } from "./formulario-de-acceso";

const navegar = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/acceso.api", () => ({ iniciarSesion: vi.fn() }));
const CORREO = "persona@correo.test";
const CONTRASENA = "temporal2026";

async function escribirCredenciales(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText(/^Correo/), CORREO);
  await usuario.type(screen.getByLabelText(/^Contraseña/), CONTRASENA);
}

describe("FormularioDeAcceso", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it.each([
    ["JUGADOR", false, "/inicio"],
    ["RECEPCIONISTA", false, "/recepcion"],
    ["ADMINISTRADOR", false, "/administracion"],
    ["ADMINISTRADOR", true, "/cambiar-contrasena"],
  ] as const)("lleva a %s al destino devuelto para su sesión", async (rol, requiereCambiarContrasena, ruta) => {
    vi.mocked(iniciarSesion).mockResolvedValue({ tipo: "autenticado", rol, requiereCambiarContrasena });
    const usuario = userEvent.setup();
    render(<FormularioDeAcceso />);
    await escribirCredenciales(usuario);

    await usuario.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(iniciarSesion).toHaveBeenCalledWith({ correo: CORREO, contrasena: CONTRASENA });
    expect(navegar.replace).toHaveBeenCalledWith(ruta);
    // Refrescar recargaría el acceso y competiría con la navegación al panel.
    expect(navegar.refresh).not.toHaveBeenCalled();
  });

  it("recupera el correo elegido y ofrece al navegador el campo de contraseña actual", async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({ tipo: "autenticado", rol: "JUGADOR", requiereCambiarContrasena: false });
    const usuario = userEvent.setup();
    const { unmount } = render(<FormularioDeAcceso />);
    const recordar = screen.getByRole("checkbox", { name: "Recordarme" });
    expect(recordar).not.toBeChecked();
    await escribirCredenciales(usuario);
    await usuario.click(recordar);
    await usuario.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    await waitFor(() => expect(navegar.replace).toHaveBeenCalledWith("/inicio"));
    unmount();

    render(<FormularioDeAcceso />);

    expect(screen.getByLabelText(/^Correo/)).toHaveValue(CORREO);
    expect(screen.getByLabelText(/^Contraseña/)).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue("");
    expect(Object.values(localStorage)).not.toContain(CONTRASENA);
  });

  it("muestra el rechazo del servidor y permite volver a intentar", async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({ tipo: "error", mensaje: "Correo o contraseña incorrectos." });
    const usuario = userEvent.setup();
    render(<FormularioDeAcceso />);
    await escribirCredenciales(usuario);

    await usuario.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
    expect(navegar.replace).not.toHaveBeenCalled();
  });

  it("envía las credenciales una vez mientras espera la respuesta", async () => {
    vi.mocked(iniciarSesion).mockReturnValue(new Promise(() => undefined));
    const usuario = userEvent.setup();
    render(<FormularioDeAcceso />);
    await escribirCredenciales(usuario);

    await usuario.dblClick(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(iniciarSesion).toHaveBeenCalledTimes(1);
  });
});
