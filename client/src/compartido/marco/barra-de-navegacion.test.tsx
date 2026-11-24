import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cerrarSesion } from "../sesion/sesion.api";
import { BarraDeNavegacion } from "./barra-de-navegacion";

const ruta = vi.hoisted(() => ({ actual: "/administracion/recepcionistas" }));
vi.mock("next/navigation", () => ({ usePathname: () => ruta.actual }));
vi.mock("../sesion/sesion.api", () => ({ cerrarSesion: vi.fn(), consultarSesion: vi.fn() }));
const VENCE = new Date(Date.now() + 15 * 60_000).toISOString();

describe("BarraDeNavegacion", () => {
  afterEach(cleanup);

  it("muestra las secciones del rol y marca la actual", () => {
    render(<BarraDeNavegacion rol="ADMINISTRADOR" venceEn={VENCE} />);

    const navegacion = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(navegacion).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual([
      "Resumen",
      "Recepcionistas",
      "Reglas de reserva",
      "Canchas",
      "Adicionales",
    ]);
    expect(within(navegacion).getByRole("link", { name: "Recepcionistas" })).toHaveAttribute("aria-current", "page");
    expect(within(navegacion).getByRole("link", { name: "Resumen" })).not.toHaveAttribute("aria-current");
  });

  it("lleva a la cuenta propia desde cualquier panel", () => {
    ruta.actual = "/recepcion/cuenta";
    render(<BarraDeNavegacion rol="RECEPCIONISTA" venceEn={VENCE} />);

    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/recepcion/cuenta");
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("aria-current", "page");
    ruta.actual = "/administracion/recepcionistas";
  });

  it("identifica el panel del rol", () => {
    render(<BarraDeNavegacion rol="RECEPCIONISTA" venceEn={VENCE} />);

    expect(screen.getByText("Recepción")).toBeInTheDocument();
  });

  it("sin secciones muestra el rol y solo ofrece cerrar la sesión", () => {
    render(<BarraDeNavegacion rol="RECEPCIONISTA" conSecciones={false} venceEn={VENCE} />);

    expect(screen.getByText("Recepción")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Secciones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mi cuenta" })).not.toBeInTheDocument();
  });

  it("sin rol solo ofrece cerrar la sesión", () => {
    render(<BarraDeNavegacion venceEn={VENCE} />);

    expect(screen.queryByRole("navigation", { name: "Secciones" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("avisa si no pudo cerrar la sesión", async () => {
    vi.mocked(cerrarSesion).mockRejectedValue(new Error("sin conexión"));
    render(<BarraDeNavegacion rol="JUGADOR" venceEn={VENCE} />);

    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cerrar tu sesión");
  });
});
