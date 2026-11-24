import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorDeAvisos } from "@/compartido/ui/avisos-flotantes";
import { cambiarMiTipoDeDocumento, cerrarMisOtrasSesiones } from "../servicios/cuenta.api";
import { CambioDeTipoDeDocumento } from "./cambio-de-tipo-de-documento";
import { MiCuentaEnPestanas } from "./mi-cuenta-en-pestanas";
import { MisSesiones } from "./mis-sesiones";
import { unaCuenta } from "../../../../test/compartido/cuenta/una-cuenta";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/cuenta.api", () => ({ cambiarMiTipoDeDocumento: vi.fn(), cerrarMisOtrasSesiones: vi.fn() }));

const conAvisos = (contenido: React.ReactNode) => render(<ProveedorDeAvisos>{contenido}</ProveedorDeAvisos>);

describe("Mi cuenta", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("muestra una pestaña a la vez: datos, seguridad y actividad", async () => {
    render(<MiCuentaEnPestanas paneles={{ datos: <p>Panel de datos</p>, seguridad: <p>Panel de seguridad</p>, actividad: <p>Panel de actividad</p> }} />);

    expect(screen.getByRole("tab", { name: "Mis datos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel de seguridad")).not.toBeVisible();
    await userEvent.click(screen.getByRole("tab", { name: "Seguridad" }));

    expect(screen.getByText("Panel de seguridad")).toBeVisible();
    expect(screen.getByText("Panel de datos")).not.toBeVisible();
  });

  describe("cambio de tipo de documento", () => {
    const personal = unaCuenta({ rol: "ADMINISTRADOR", puedeCambiarTipoDeDocumento: true });

    it("pide leer el aviso legal antes de cambiar, y avisa al terminar", async () => {
      vi.mocked(cambiarMiTipoDeDocumento).mockResolvedValue({ tipo: "hecho" });
      const usuario = userEvent.setup();
      conAvisos(<CambioDeTipoDeDocumento cuenta={personal} />);

      await usuario.click(screen.getByRole("button", { name: "Cambiar a carné de extranjería" }));
      const dialogo = screen.getByRole("dialog");
      expect(dialogo).toHaveTextContent("Se hace una sola vez");
      await usuario.type(screen.getByLabelText(/^Número de carné/), "001234567");
      expect(screen.getByRole("button", { name: "Cambiar mi documento" })).toBeDisabled();
      await usuario.click(screen.getByLabelText("Leí el aviso y mi documento cambió."));
      await usuario.click(screen.getByRole("button", { name: "Cambiar mi documento" }));

      expect(cambiarMiTipoDeDocumento).toHaveBeenCalledWith("CARNE_EXTRANJERIA", "001234567");
      expect(await screen.findByRole("status")).toHaveTextContent("Tu documento ahora es carné de extranjería.");
    });

    it("si ya se cambió una vez, no ofrece el cambio", () => {
      conAvisos(<CambioDeTipoDeDocumento cuenta={{ ...personal, puedeCambiarTipoDeDocumento: false }} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("sesiones abiertas", () => {
    const sesiones = [
      { id: 1, dispositivo: "Chrome en Windows", abiertaEn: "2026-11-24T15:00:00.000Z", ultimaActividadEn: "2026-11-24T15:10:00.000Z", actual: true },
      { id: 2, dispositivo: "Safari en iPhone", abiertaEn: "2026-11-24T14:00:00.000Z", ultimaActividadEn: "2026-11-24T14:30:00.000Z", actual: false },
    ];

    it("marca la actual y cierra las demás", async () => {
      vi.mocked(cerrarMisOtrasSesiones).mockResolvedValue({ tipo: "hecho" });
      conAvisos(<MisSesiones sesiones={sesiones} />);

      expect(screen.getByText("Esta sesión")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Cerrar las demás" }));

      expect(cerrarMisOtrasSesiones).toHaveBeenCalled();
      expect(await screen.findByRole("status")).toHaveTextContent("Cerramos tu otra sesión.");
    });

    it("con una sola sesión no ofrece cerrar las demás", () => {
      conAvisos(<MisSesiones sesiones={[sesiones[0]]} />);

      expect(screen.queryByRole("button", { name: "Cerrar las demás" })).not.toBeInTheDocument();
    });
  });
});
