import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cerrarSesion } from "../sesion/sesion.api";
import { BarraDeNavegacion } from "./barra-de-navegacion";

const ruta = vi.hoisted(() => ({ actual: "/administracion/recepcionistas" }));
vi.mock("@/compartido/avisos/canal-de-avisos", () => ({ escucharAvisos: () => () => undefined }));
vi.mock("next/navigation", () => ({ usePathname: () => ruta.actual }));
vi.mock("../sesion/sesion.api", () => ({ cerrarSesion: vi.fn(), consultarTiempoRestante: vi.fn() }));
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
      "Reclamos",
    ]);
    expect(within(navegacion).getByRole("link", { name: "Recepcionistas" })).toHaveAttribute("aria-current", "page");
    expect(within(navegacion).getByRole("link", { name: "Resumen" })).not.toHaveAttribute("aria-current");
  });

  it("el menú de la cuenta lleva a la cuenta propia desde cualquier panel", async () => {
    ruta.actual = "/recepcion/cuenta";
    render(<BarraDeNavegacion rol="RECEPCIONISTA" venceEn={VENCE} />);
    const boton = screen.getByRole("button", { name: "Mi cuenta" });

    expect(boton).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(boton);

    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Ver mi cuenta" })).toHaveAttribute("href", "/recepcion/cuenta");
    expect(screen.getByRole("link", { name: "Ver mi cuenta" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Historial de cambios" })).not.toBeInTheDocument();
    ruta.actual = "/administracion/recepcionistas";
  });

  it("solo administración ve el historial de cambios en el menú", async () => {
    render(<BarraDeNavegacion rol="ADMINISTRADOR" venceEn={VENCE} />);

    await userEvent.click(screen.getByRole("button", { name: "Mi cuenta" }));

    expect(screen.getByRole("link", { name: "Historial de cambios" })).toHaveAttribute("href", "/administracion/historial");
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("el menú se cierra con Escape y devuelve el foco al botón", async () => {
    render(<BarraDeNavegacion rol="ADMINISTRADOR" venceEn={VENCE} />);
    const boton = screen.getByRole("button", { name: "Mi cuenta" });

    await userEvent.click(boton);
    await userEvent.keyboard("{Escape}");

    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Ver mi cuenta" })).not.toBeInTheDocument();
    expect(boton).toHaveFocus();
  });

  it("el menú se cierra al tocar fuera de él", async () => {
    render(<BarraDeNavegacion rol="ADMINISTRADOR" venceEn={VENCE} />);

    await userEvent.click(screen.getByRole("button", { name: "Mi cuenta" }));
    await userEvent.click(screen.getByText("Administración"));

    expect(screen.queryByRole("link", { name: "Ver mi cuenta" })).not.toBeInTheDocument();
  });

  it("identifica el panel del rol", () => {
    render(<BarraDeNavegacion rol="RECEPCIONISTA" venceEn={VENCE} />);

    expect(screen.getByText("Recepción")).toBeInTheDocument();
  });

  it("sin secciones muestra el rol y solo ofrece cerrar la sesión", () => {
    render(<BarraDeNavegacion rol="RECEPCIONISTA" conSecciones={false} venceEn={VENCE} />);

    expect(screen.getByText("Recepción")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Secciones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mi cuenta" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("sin rol solo ofrece cerrar la sesión", () => {
    render(<BarraDeNavegacion venceEn={VENCE} />);

    expect(screen.queryByRole("navigation", { name: "Secciones" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("avisa si no pudo cerrar la sesión", async () => {
    vi.mocked(cerrarSesion).mockRejectedValue(new Error("sin conexión"));
    render(<BarraDeNavegacion rol="JUGADOR" venceEn={VENCE} />);

    await userEvent.click(screen.getByRole("button", { name: "Mi cuenta" }));
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cerrar tu sesión");
  });
});
