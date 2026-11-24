import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { desactivarCancha, editarCancha, eliminarCancha, reactivarCancha } from "../servicios/canchas.api";
import type { Cancha } from "../servicios/canchas";
import { ProveedorDeAvisos } from "./avisos-de-canchas";
import { FichaDeCancha } from "./ficha-de-cancha";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/canchas.api", () => ({
  editarCancha: vi.fn(),
  desactivarCancha: vi.fn(),
  reactivarCancha: vi.fn(),
  eliminarCancha: vi.fn(),
}));

function unaCancha(cambios: Partial<Cancha> = {}): Cancha {
  return {
    id: 3,
    nombre: "Cancha 3",
    tipo: "FUTBOL_5",
    tieneIluminacion: false,
    caracteristicas: ["TECHADA", "BANCAS"],
    nota: "La banda izquierda va pegada a la pared.",
    estado: "OPERATIVA",
    sePuedeEliminar: true,
    ...cambios,
  };
}

function mostrar(cancha = unaCancha()) {
  render(
    <ProveedorDeAvisos>
      <FichaDeCancha cancha={cancha} hoy="2026-11-24" />
    </ProveedorDeAvisos>,
  );
  return { usuario: userEvent.setup(), ficha: screen.getByRole("article", { name: cancha.nombre }) };
}

describe("FichaDeCancha", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("muestra el nombre, el estado, el tamaño, la luz, los detalles y la nota", () => {
    const { ficha } = mostrar();

    for (const texto of ["Operativa", "Fútbol 5", "Solo con luz natural", "Techada", "Bancas", "La banda izquierda va pegada a la pared."]) {
      expect(within(ficha).getByText(texto)).toBeInTheDocument();
    }
  });

  it("en mantenimiento dice hasta cuándo y muestra el próximo bloqueo", () => {
    const { ficha } = mostrar(
      unaCancha({
        mantenimiento: { hasta: "2026-11-24T19:00:00.000Z", tipo: "EMERGENCIA" },
        proximoMantenimiento: { inicio: "2026-11-28T12:00:00.000Z", fin: "2026-11-28T15:00:00.000Z" },
      }),
    );

    expect(within(ficha).getByText("Mantenimiento")).toBeInTheDocument();
    expect(within(ficha).getByText("No se puede reservar hasta 14:00")).toBeInTheDocument();
    expect(within(ficha).queryByText("Operativa")).not.toBeInTheDocument();
    expect(within(ficha).getByText("sáb 28 nov, 07:00 – 10:00")).toBeInTheDocument();
  });

  it("pide confirmar antes de desactivar y refresca al terminar", async () => {
    vi.mocked(desactivarCancha).mockResolvedValue({ tipo: "hecho" });
    const { usuario } = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(desactivarCancha).not.toHaveBeenCalled();
    await usuario.click(screen.getByRole("button", { name: "Sí, desactivar" }));

    expect(desactivarCancha).toHaveBeenCalledWith(3);
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
    expect(await screen.findByRole("status")).toHaveTextContent("Cancha 3 quedó desactivada.");
  });

  it("si tiene reservas por jugar no la desactiva y lista las reservas", async () => {
    vi.mocked(desactivarCancha).mockResolvedValue({
      tipo: "bloqueada",
      mensaje: "No se puede desactivar: la cancha tiene reservas por jugar.",
      reservas: [{ inicio: "2026-11-29T00:00:00.000Z", fin: "2026-11-29T01:00:00.000Z", titular: "R. Castillo" }],
    });
    const { usuario } = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Desactivar" }));
    await usuario.click(screen.getByRole("button", { name: "Sí, desactivar" }));

    const bloqueo = await screen.findByRole("alert");
    expect(bloqueo).toHaveTextContent(/tiene reservas por jugar/);
    expect(within(bloqueo).getByRole("listitem")).toHaveTextContent("28 nov 2026, 19:00 – 20:00 · R. Castillo");
    expect(navegar.refresh).not.toHaveBeenCalled();
  });

  it("a una cancha desactivada le ofrece reactivarla", async () => {
    vi.mocked(reactivarCancha).mockResolvedValue({ tipo: "hecho" });
    const { usuario } = mostrar(unaCancha({ estado: "DESACTIVADA" }));
    expect(screen.queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Reactivar" }));

    expect(reactivarCancha).toHaveBeenCalledWith(3);
  });

  it("ofrece eliminar solo si la cancha nunca tuvo reservas", async () => {
    vi.mocked(eliminarCancha).mockResolvedValue({ tipo: "hecho" });
    const { usuario } = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Eliminar" }));
    await usuario.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(eliminarCancha).toHaveBeenCalledWith(3);
    cleanup();
    mostrar(unaCancha({ sePuedeEliminar: false }));
    expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
  });

  it("edita los datos y muestra junto al campo el nombre repetido que rechaza el server", async () => {
    vi.mocked(editarCancha).mockResolvedValue({
      tipo: "datos-rechazados",
      errores: { nombre: "Ya existe una cancha llamada «Cancha 1»." },
    });
    const { usuario } = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    const edicion = screen.getByRole("dialog", { name: "Editar Cancha 3" });
    const nombre = within(edicion).getByLabelText(/^Nombre/);
    await usuario.clear(nombre);
    await usuario.type(nombre, "Cancha 1");
    await usuario.click(screen.getByRole("button", { name: "Con luz" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(editarCancha).toHaveBeenCalledWith(3, {
      nombre: "Cancha 1",
      tipo: "FUTBOL_5",
      tieneIluminacion: true,
      caracteristicas: ["TECHADA", "BANCAS"],
      nota: "La banda izquierda va pegada a la pared.",
    });
    expect(await screen.findByText("Ya existe una cancha llamada «Cancha 1».")).toBeInTheDocument();
    expect(nombre).toHaveAttribute("aria-invalid", "true");
  });

  it("edita en una tarjeta flotante que se cierra al guardar, sin mover la ficha", async () => {
    vi.mocked(editarCancha).mockResolvedValue({ tipo: "guardada", cancha: unaCancha({ tipo: "FUTBOL_7" }) });
    const { usuario, ficha } = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    expect(within(ficha).getByText("Solo con luz natural")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Fútbol 7" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(navegar.refresh).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Se guardaron los cambios de Cancha 3.");
  });

  it("no envía la edición si falta el nombre", async () => {
    const { usuario } = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    await usuario.clear(screen.getByLabelText(/^Nombre/));
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(screen.getByText("Escribe el nombre de la cancha.")).toBeInTheDocument();
    expect(editarCancha).not.toHaveBeenCalled();
  });
});
