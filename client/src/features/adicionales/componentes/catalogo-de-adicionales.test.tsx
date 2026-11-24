import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registrarAdicional } from "../servicios/adicionales.api";
import type { Adicional } from "../servicios/adicionales";
import { CatalogoDeAdicionales } from "./catalogo-de-adicionales";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/adicionales.api", () => ({ registrarAdicional: vi.fn() }));

const BALON: Adicional = { id: 1, nombre: "Balón", descripcion: "N.º 5", precio: "45.00", estado: "ACTIVO", sePuedeEliminar: true };

function mostrar(adicionales: Adicional[] = []) {
  render(<CatalogoDeAdicionales adicionales={adicionales} cambios={[]} />);
  return userEvent.setup();
}

const alta = () => screen.getByRole("form", { name: "Agregar adicional" });

describe("CatalogoDeAdicionales", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("sin adicionales invita a empezar y una idea llena el nombre", async () => {
    const usuario = mostrar();

    expect(screen.getByRole("heading", { name: "Aún no hay adicionales" })).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Chalecos" }));

    expect(within(alta()).getByLabelText(/^Nombre/)).toHaveValue("Chalecos");
    expect(within(alta()).getByLabelText(/^Precio por unidad/)).toHaveFocus();
  });

  it("agrega un adicional, avisa y vuelve a pedir la lista", async () => {
    vi.mocked(registrarAdicional).mockResolvedValue({ tipo: "guardado", adicional: { ...BALON, id: 2, nombre: "Chalecos", precio: "15.50" } });
    const usuario = mostrar([BALON]);

    await usuario.type(within(alta()).getByLabelText(/^Nombre/), "Chalecos");
    await usuario.type(within(alta()).getByLabelText(/^Precio por unidad/), "15.50");
    await usuario.click(screen.getByRole("button", { name: "Agregar al catálogo" }));

    expect(registrarAdicional).toHaveBeenCalledWith({ nombre: "Chalecos", descripcion: "", precio: "15.50" });
    expect(await screen.findByRole("status")).toHaveTextContent("Chalecos se agregó al catálogo.");
    expect(navegar.refresh).toHaveBeenCalled();
    expect(within(alta()).getByLabelText(/^Nombre/)).toHaveValue("");
  });

  it("el precio no admite signos ni letras", async () => {
    const usuario = mostrar();
    const precio = within(alta()).getByLabelText(/^Precio por unidad/);

    await usuario.type(precio, "-1a5.505");

    expect(precio).toHaveValue("15.50");
  });

  it("con precio cero dice por qué y no envía", async () => {
    const usuario = mostrar();

    await usuario.type(within(alta()).getByLabelText(/^Nombre/), "Balón");
    await usuario.type(within(alta()).getByLabelText(/^Precio por unidad/), "0");
    await usuario.click(screen.getByRole("button", { name: "Agregar al catálogo" }));

    expect(await within(alta()).findByText("El monto debe ser mayor que cero.")).toBeInTheDocument();
    expect(registrarAdicional).not.toHaveBeenCalled();
  });

  it("si el nombre ya existe, lo dice junto al campo", async () => {
    vi.mocked(registrarAdicional).mockResolvedValue({ tipo: "datos-rechazados", errores: { nombre: "Ya existe un adicional llamado «balon»." } });
    const usuario = mostrar([BALON]);

    await usuario.type(within(alta()).getByLabelText(/^Nombre/), "balon");
    await usuario.type(within(alta()).getByLabelText(/^Precio por unidad/), "40");
    await usuario.click(screen.getByRole("button", { name: "Agregar al catálogo" }));

    expect(await within(alta()).findByText("Ya existe un adicional llamado «balon».")).toBeInTheDocument();
    expect(navegar.refresh).not.toHaveBeenCalled();
  });

  it("lista cada adicional con su precio por unidad y marca los desactivados", () => {
    mostrar([BALON, { ...BALON, id: 2, nombre: "Chalecos", descripcion: null, precio: "15.00", estado: "DESACTIVADO" }]);

    const [balon, chalecos] = within(screen.getByRole("list", { name: "Catálogo" })).getAllByRole("listitem");
    expect(balon).toHaveTextContent("BalónN.º 5S/ 45.00por unidad");
    expect(within(chalecos).getByText("Desactivado")).toBeInTheDocument();
  });
});
