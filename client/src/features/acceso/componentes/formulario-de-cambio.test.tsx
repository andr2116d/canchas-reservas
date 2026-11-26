import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cambiarContrasenaTemporal, omitirCambioDeContrasena } from "../servicios/acceso.api";
import { FormularioDeCambio } from "./formulario-de-cambio";

const navegar = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/acceso.api", () => ({
  cambiarContrasenaTemporal: vi.fn(),
  omitirCambioDeContrasena: vi.fn(),
}));

describe("FormularioDeCambio", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("permite dejar el cambio para después y lleva al panel", async () => {
    vi.mocked(omitirCambioDeContrasena).mockResolvedValue({ tipo: "omitido" });
    render(<FormularioDeCambio panel="/recepcion" />);

    await userEvent.click(screen.getByRole("button", { name: "Ahora no" }));

    await waitFor(() => expect(navegar.replace).toHaveBeenCalledWith("/recepcion"));
  });

  it("explica que se volverá a pedir en cada inicio de sesión", () => {
    render(<FormularioDeCambio panel="/recepcion" />);

    expect(screen.getByText(/te lo volveremos a pedir cada vez que entres/)).toBeInTheDocument();
  });

  it("muestra el error si no se pudo omitir el cambio", async () => {
    vi.mocked(omitirCambioDeContrasena).mockResolvedValue({
      tipo: "error",
      mensaje: "No pudimos conectar con La Previa. Inténtalo de nuevo.",
    });
    render(<FormularioDeCambio panel="/recepcion" />);

    await userEvent.click(screen.getByRole("button", { name: "Ahora no" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar");
    expect(navegar.replace).not.toHaveBeenCalled();
  });

  describe("cambio de la contraseña temporal", () => {
    async function escribir(nueva: string, confirmacion = nueva) {
      const usuario = userEvent.setup();
      render(<FormularioDeCambio panel="/recepcion" />);
      await usuario.type(screen.getByLabelText("Nueva contraseña"), nueva);
      await usuario.type(screen.getByLabelText("Confirma la contraseña"), confirmacion);
      return usuario;
    }

    it("si las contraseñas no coinciden no envía nada y lo dice", async () => {
      const usuario = await escribir("definitiva2026", "definitiva2027");

      await usuario.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

      expect(await screen.findByText("Las contraseñas deben coincidir.")).toBeInTheDocument();
      expect(cambiarContrasenaTemporal).not.toHaveBeenCalled();
    });

    it("al cambiarla lleva al destino que indica la sesión", async () => {
      vi.mocked(cambiarContrasenaTemporal).mockResolvedValue({
        tipo: "autenticado",
        rol: "RECEPCIONISTA",
        requiereCambiarContrasena: false,
      });
      const usuario = await escribir("definitiva2026");

      await usuario.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

      await waitFor(() => expect(navegar.replace).toHaveBeenCalledWith("/recepcion"));
    });

    it("un doble clic envía el cambio una sola vez", async () => {
      vi.mocked(cambiarContrasenaTemporal).mockReturnValue(new Promise(() => {}));
      const usuario = await escribir("definitiva2026");
      const boton = screen.getByRole("button", { name: "Cambiar contraseña" });

      await usuario.dblClick(boton);

      expect(cambiarContrasenaTemporal).toHaveBeenCalledTimes(1);
    });

    it("si la sesión venció vuelve al acceso explicando el motivo", async () => {
      vi.mocked(cambiarContrasenaTemporal).mockResolvedValue({ tipo: "error", mensaje: "x", sesionVencida: true });
      const usuario = await escribir("definitiva2026");

      await usuario.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

      await waitFor(() => expect(navegar.replace).toHaveBeenCalledWith("/iniciar-sesion?motivo=inactividad"));
    });

    it("muestra el motivo del rechazo y deja volver a intentarlo", async () => {
      vi.mocked(cambiarContrasenaTemporal).mockResolvedValueOnce({
        tipo: "error",
        mensaje: "La contraseña nueva debe ser distinta de la temporal.",
      });
      const usuario = await escribir("temporal2026");

      await usuario.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

      expect(await screen.findByText("La contraseña nueva debe ser distinta de la temporal.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cambiar contraseña" })).toBeEnabled();
    });
  });
});
