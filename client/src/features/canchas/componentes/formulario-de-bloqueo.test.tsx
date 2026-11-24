import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bloquearCanchas } from "../servicios/bloqueos.api";
import { ProveedorDeAvisos } from "./avisos-de-canchas";
import { FormularioDeBloqueo } from "./formulario-de-bloqueo";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/bloqueos.api", () => ({ bloquearCanchas: vi.fn() }));

const CANCHAS = [
  { id: 1, nombre: "Cancha 1" },
  { id: 2, nombre: "Cancha 2" },
];
// Martes 24 de noviembre de 2026, 10:30 en Lima.
const AHORA = "2026-11-24T15:30:00.000Z";

function mostrar() {
  render(
    <ProveedorDeAvisos>
      <FormularioDeBloqueo canchas={CANCHAS} ahora={AHORA} />
    </ProveedorDeAvisos>,
  );
  return userEvent.setup();
}

async function llenarMotivo(usuario: ReturnType<typeof userEvent.setup>, motivo = "Cambio de redes.") {
  await usuario.type(screen.getByLabelText(/^Motivo/), motivo);
}

describe("FormularioDeBloqueo", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("propone empezar en la próxima hora en punto, por dos horas", () => {
    mostrar();

    expect(screen.getByLabelText("Fecha de inicio")).toHaveValue("2026-11-24");
    expect(screen.getByRole("spinbutton", { name: "Horas de Inicio" })).toHaveValue("11");
    expect(screen.getByRole("spinbutton", { name: "Horas de Fin" })).toHaveValue("13");
  });

  it("bloquea las canchas elegidas en el rango de Lima y avisa", async () => {
    vi.mocked(bloquearCanchas).mockResolvedValue({ tipo: "creados", bloqueos: [{ id: 1 }, { id: 2 }] as never, reservasAfectadas: [] });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Todas" }));
    await llenarMotivo(usuario);
    await usuario.click(screen.getByRole("button", { name: "Bloquear 2 canchas" }));

    expect(bloquearCanchas).toHaveBeenCalledWith({
      canchaIds: [1, 2],
      tipo: "PROGRAMADO",
      desdeAhora: false,
      desdeFecha: "2026-11-24",
      desdeHora: "11:00",
      hastaFecha: "2026-11-24",
      hastaHora: "13:00",
      motivo: "Cambio de redes.",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Se guardaron 2 bloqueos.");
    expect(navegar.refresh).toHaveBeenCalled();
  });

  it("una emergencia empieza ahora y, si afecta reservas, las muestra al guardar", async () => {
    vi.mocked(bloquearCanchas).mockResolvedValue({
      tipo: "creados",
      bloqueos: [{ id: 1 }] as never,
      reservasAfectadas: [{ cancha: "Cancha 1", inicio: "2026-11-24T16:00:00.000Z", fin: "2026-11-24T17:00:00.000Z", titular: "R. Castillo" }],
    });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Cancha 1" }));
    await usuario.click(screen.getByRole("button", { name: "Emergencia" }));
    expect(screen.queryByLabelText("Fecha de inicio")).not.toBeInTheDocument();
    await llenarMotivo(usuario, "Se rompió un reflector.");
    await usuario.click(screen.getByRole("button", { name: "Bloquear 1 cancha" }));

    expect(bloquearCanchas).toHaveBeenCalledWith(expect.objectContaining({ tipo: "EMERGENCIA", desdeAhora: true, desdeFecha: undefined }));
    const afectadas = await screen.findByRole("alert");
    expect(afectadas).toHaveTextContent("1 reserva quedó afectada");
    expect(within(afectadas).getByRole("listitem")).toHaveTextContent("Cancha 1 · mar 24 nov, 11:00 – 12:00 · R. Castillo");
  });

  it("si uno programado choca con reservas, no se guarda y las lista", async () => {
    vi.mocked(bloquearCanchas).mockResolvedValue({
      tipo: "choca-con-reservas",
      mensaje: "Choca con reservas: reubícalas o cancélalas antes, o elige otras horas.",
      reservas: [{ cancha: "Cancha 2", inicio: "2026-11-24T16:00:00.000Z", fin: "2026-11-24T17:00:00.000Z", titular: "M. Quispe" }],
    });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Cancha 2" }));
    await llenarMotivo(usuario);
    await usuario.click(screen.getByRole("button", { name: "Bloquear 1 cancha" }));

    const choque = await screen.findByRole("alert");
    expect(choque).toHaveTextContent("Choca con reservas");
    expect(choque).toHaveTextContent("M. Quispe");
    expect(navegar.refresh).not.toHaveBeenCalled();
  });

  it("dice qué falta antes de enviar: canchas y motivo", async () => {
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: /^Bloquear/ }));

    expect(screen.getByText("Elige al menos una cancha.")).toBeInTheDocument();
    expect(screen.getByText("Escribe el motivo del bloqueo.")).toBeInTheDocument();
    expect(bloquearCanchas).not.toHaveBeenCalled();
  });

  it("con repetición envía cada cuánto y hasta cuándo", async () => {
    vi.mocked(bloquearCanchas).mockResolvedValue({ tipo: "creados", bloqueos: [], reservasAfectadas: [] });
    const usuario = mostrar();

    await usuario.click(screen.getByRole("button", { name: "Cancha 1" }));
    await llenarMotivo(usuario);
    await usuario.click(screen.getByText(/^¿Se repite\?/));
    await usuario.click(screen.getByRole("button", { name: "Cada semana" }));
    await usuario.clear(screen.getByLabelText("Hasta el"));
    await usuario.type(screen.getByLabelText("Hasta el"), "2026-12-15");
    await usuario.click(screen.getByRole("button", { name: "Bloquear 1 cancha" }));

    expect(bloquearCanchas).toHaveBeenCalledWith(expect.objectContaining({ repeticion: { frecuencia: "SEMANAL", hasta: "2026-12-15" } }));
  });
});
