import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { omitirCambioDeContrasena } from "../servicios/acceso.api";
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
});
