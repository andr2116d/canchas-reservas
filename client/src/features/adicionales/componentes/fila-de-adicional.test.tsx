import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorDeAvisos } from "@/compartido/ui/avisos-flotantes";
import { desactivarAdicional, editarAdicional, eliminarAdicional, reactivarAdicional } from "../servicios/adicionales.api";
import type { Adicional } from "../servicios/adicionales";
import { FilaDeAdicional } from "./fila-de-adicional";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/adicionales.api", () => ({
  editarAdicional: vi.fn(),
  desactivarAdicional: vi.fn(),
  reactivarAdicional: vi.fn(),
  eliminarAdicional: vi.fn(),
}));

const BALON: Adicional = { id: 1, nombre: "Balón", descripcion: "N.º 5", precio: "45.00", estado: "ACTIVO", sePuedeEliminar: true };

function mostrar(adicional: Adicional = BALON) {
  render(
    <ProveedorDeAvisos>
      <ul>
        <FilaDeAdicional adicional={adicional} />
      </ul>
    </ProveedorDeAvisos>,
  );
  return userEvent.setup();
}

describe("FilaDeAdicional", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("edita en una tarjeta flotante con sus datos y avisa al guardar", async () => {
    vi.mocked(editarAdicional).mockResolvedValue({ tipo: "guardado", adicional: { ...BALON, precio: "50.00" } });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    const edicion = screen.getByRole("dialog", { name: "Editar Balón" });
    expect(within(edicion).getByLabelText(/^Descripción/)).toHaveValue("N.º 5");
    const precio = within(edicion).getByLabelText(/^Precio por unidad/);
    await usuario.clear(precio);
    await usuario.type(precio, "50");
    await usuario.click(within(edicion).getByRole("button", { name: "Guardar cambios" }));

    expect(editarAdicional).toHaveBeenCalledWith(1, { nombre: "Balón", descripcion: "N.º 5", precio: "50" });
    expect(await screen.findByRole("status")).toHaveTextContent("Se guardaron los cambios de Balón.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(navegar.refresh).toHaveBeenCalled();
  });

  it("guardar sin cambios lo dice", async () => {
    vi.mocked(editarAdicional).mockResolvedValue({ tipo: "guardado", adicional: BALON });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("status")).toHaveTextContent("No había cambios: Balón sigue igual.");
  });

  it("desactiva y avisa que recepción ya no lo ofrece", async () => {
    vi.mocked(desactivarAdicional).mockResolvedValue({ tipo: "hecho" });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Desactivar" }));

    expect(desactivarAdicional).toHaveBeenCalledWith(1);
    expect(await screen.findByRole("status")).toHaveTextContent("Balón quedó desactivado: no se ofrece ni se entrega.");
  });

  it("uno desactivado se reactiva", async () => {
    vi.mocked(reactivarAdicional).mockResolvedValue({ tipo: "hecho" });
    const usuario = mostrar({ ...BALON, estado: "DESACTIVADO" });

    await usuario.click(screen.getByRole("button", { name: "Reactivar" }));

    expect(reactivarAdicional).toHaveBeenCalledWith(1);
    expect(await screen.findByRole("status")).toHaveTextContent("Balón vuelve a estar disponible.");
  });

  it("eliminar pide confirmar antes", async () => {
    vi.mocked(eliminarAdicional).mockResolvedValue({ tipo: "hecho" });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(eliminarAdicional).not.toHaveBeenCalled();
    await usuario.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(eliminarAdicional).toHaveBeenCalledWith(1);
    expect(await screen.findByRole("status")).toHaveTextContent("Balón se eliminó.");
  });

  it("si ya se usó no ofrece eliminarlo", () => {
    mostrar({ ...BALON, sePuedeEliminar: false });

    expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
  });

  it("muestra el error si la acción falla", async () => {
    vi.mocked(desactivarAdicional).mockResolvedValue({ tipo: "error", mensaje: "No pudimos conectar con La Previa." });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Desactivar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar con La Previa.");
  });
});
