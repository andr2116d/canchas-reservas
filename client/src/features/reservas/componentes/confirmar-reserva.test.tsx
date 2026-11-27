import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resumenDePrueba } from "../../../../test/features/reservas/resumen-de-prueba";
import { escucharCambios } from "@/compartido/disponibilidad/avisos-de-cambios";
import { consultarResumen, separarTurno } from "../servicios/reservas.api";
import { ConfirmarReserva } from "./confirmar-reserva";

const navegar = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/reservas.api", () => ({ consultarResumen: vi.fn(), separarTurno: vi.fn() }));
vi.mock("@/compartido/disponibilidad/avisos-de-cambios", () => ({ escucharCambios: vi.fn() }));

const TURNO = { canchaId: 1, fecha: "2026-11-28", desde: "19:00" };
const botonSeparar = () => screen.findByRole("button", { name: "Separar Cancha 1 · 19:00–20:00" });

function mostrar() {
  vi.mocked(consultarResumen).mockResolvedValue({ tipo: "consultado", resumen: resumenDePrueba() });
  render(<ConfirmarReserva turno={TURNO} />);
}

describe("ConfirmarReserva", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(escucharCambios).mockReturnValue(() => undefined);
  });
  afterEach(cleanup);

  it("muestra el turno, el precio final, el adelanto, lo que queda para el local y los plazos con fecha y hora", async () => {
    mostrar();

    const turno = await screen.findByRole("region", { name: "Tu turno" });
    expect(turno).toHaveTextContent("Cancha 1");
    expect(turno).toHaveTextContent("19:00–20:00");
    expect(turno).toHaveTextContent("sábado, 28 de noviembre");
    const total = screen.getByRole("region", { name: "Precio final, con IGV" });
    expect(total).toHaveTextContent("S/ 80.00");
    expect(total).toHaveTextContent("Adelanto para confirmarla (50 %)S/ 40.00");
    expect(total).toHaveTextContent("El resto, en el localS/ 40.00");
    const plazos = within(screen.getByRole("region", { name: "Si cancelas" })).getAllByRole("listitem");
    expect(plazos.map((plazo) => plazo.textContent)).toEqual([
      "Hasta el vie 27 nov, 19:00Se devuelve el 100 % del adelanto, o crédito si lo prefieres",
      "Hasta el sáb 28 nov, 17:00Se devuelve el 50 % del adelanto",
      "Hasta el sáb 28 nov, 19:00El adelanto no se devuelve",
    ]);
  });

  it("ofrece el material del local con su precio por pérdida, sin nada marcado", async () => {
    mostrar();

    const balon = await screen.findByRole("checkbox", { name: /Balón/ });
    expect(balon).not.toBeChecked();
    expect(balon.closest("label")).toHaveTextContent("S/ 35.00 por unidad perdida o rota");
    expect(screen.getByRole("checkbox", { name: /Chalecos/ })).not.toBeChecked();
  });

  it("separa con los montos vistos y el material marcado, y abre la reserva", async () => {
    vi.mocked(separarTurno).mockResolvedValue({ tipo: "separada", codigo: "7K3Q9X" });
    const usuario = userEvent.setup();
    mostrar();
    await usuario.click(await screen.findByRole("checkbox", { name: /Balón/ }));

    await usuario.click(await botonSeparar());

    expect(separarTurno).toHaveBeenCalledWith({ ...TURNO, precio: "80.00", adelanto: "40.00", adicionales: [11] });
    expect(navegar.push).toHaveBeenCalledWith("/inicio/mis-reservas/7K3Q9X");
  });

  it("un doble clic separa una sola vez", async () => {
    vi.mocked(separarTurno).mockReturnValue(new Promise(() => undefined));
    const usuario = userEvent.setup();
    mostrar();

    await usuario.dblClick(await botonSeparar());

    expect(separarTurno).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Separando tu turno…" })).toBeDisabled();
  });

  it("si el precio cambió, muestra los montos nuevos y lo avisa", async () => {
    vi.mocked(separarTurno).mockResolvedValue({ tipo: "montos-cambiaron", mensaje: "El precio de este turno cambió.", precio: "90.00", adelanto: "45.00" });
    const usuario = userEvent.setup();
    mostrar();
    const boton = await botonSeparar();
    vi.mocked(consultarResumen).mockResolvedValue({ tipo: "consultado", resumen: resumenDePrueba({ precio: "90.00", adelanto: "45.00" }) });

    await usuario.click(boton);

    expect(await screen.findByRole("alert")).toHaveTextContent("El precio de este turno cambió.");
    expect(screen.getByRole("region", { name: "Precio final, con IGV" })).toHaveTextContent("S/ 90.00");
  });

  it("si el turno ya no está libre, lo dice y ofrece elegir otro", async () => {
    vi.mocked(consultarResumen).mockResolvedValue({ tipo: "no-disponible", mensaje: "Este turno ya no está libre. Elige otro." });
    render(<ConfirmarReserva turno={TURNO} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Este turno ya no está libre. Elige otro.");
    expect(screen.getByRole("link", { name: "Elegir otro turno" })).toHaveAttribute("href", "/inicio/reservar");
  });

  it("si otra persona lo separa mientras se revisa, la pantalla lo dice sola", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mostrar();
    await botonSeparar();
    const { alCambiar } = vi.mocked(escucharCambios).mock.calls[0][0];
    vi.mocked(consultarResumen).mockResolvedValue({ tipo: "no-disponible", mensaje: "Este turno ya no está libre. Elige otro." });

    await act(async () => {
      alCambiar();
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Este turno ya no está libre.");
    vi.useRealTimers();
  });

  it("sin sesión vuelve a ingresar sin perder el turno", async () => {
    vi.mocked(consultarResumen).mockResolvedValue({ tipo: "sin-sesion" });
    render(<ConfirmarReserva turno={TURNO} />);

    await vi.waitFor(() =>
      expect(navegar.replace).toHaveBeenCalledWith("/iniciar-sesion?cancha=1&fecha=2026-11-28&desde=19%3A00"),
    );
  });
});
