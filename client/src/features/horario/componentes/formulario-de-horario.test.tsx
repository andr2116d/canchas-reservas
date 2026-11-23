import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HorarioConsultado } from "@/compartido/horario/horario";
import { guardarHorario } from "../servicios/horario.api";
import { FormularioDeHorario } from "./formulario-de-horario";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/horario.api", () => ({ guardarHorario: vi.fn() }));

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;

function conHorario(): HorarioConsultado {
  const vigente = {
    inicioDeLaNoche: "18:00",
    dias: DIAS.map((dia) =>
      dia === "DOMINGO" ? { dia, abierto: false } : { dia, abierto: true, abre: "08:00", cierra: "22:00" },
    ),
    guardadoEn: "2026-11-23T01:30:00.000Z",
    guardadoPor: "Valeria León",
  };
  return { vigente, historial: [vigente], inicioDeLaNochePorDefecto: "18:00" };
}

const diaLlamado = (nombre: string) => screen.getByRole("group", { name: nombre });
const horasDe = (dia: string, etiqueta: string) =>
  within(diaLlamado(dia)).getByRole("spinbutton", { name: `Horas de ${etiqueta}` });

describe("FormularioDeHorario", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra cada día con su horario, el domingo cerrado y desde cuándo rige", () => {
    render(<FormularioDeHorario consultado={conHorario()} />);

    expect(horasDe("Lunes", "Abre")).toHaveValue("08");
    expect(horasDe("Lunes", "Cierra")).toHaveValue("22");
    expect(within(diaLlamado("Domingo")).getByRole("switch", { name: "Abre el domingo" })).not.toBeChecked();
    expect(within(diaLlamado("Domingo")).queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.getByText(/Vigente desde/)).toHaveTextContent("Vigente desde 22 nov 2026, 20:30 · por Valeria León");
  });

  it("sin horario guardado avisa que todavía no se ofrecen turnos", () => {
    render(<FormularioDeHorario consultado={{ historial: [], inicioDeLaNochePorDefecto: "18:00" }} />);

    expect(screen.getByText(/Todavía no hay horario guardado/)).toBeInTheDocument();
  });

  it("no deja guardar un cierre anterior a la apertura y lo marca en su día", async () => {
    const usuario = userEvent.setup();
    render(<FormularioDeHorario consultado={conHorario()} />);

    await usuario.click(horasDe("Martes", "Cierra"));
    await usuario.keyboard("07");
    await usuario.click(screen.getByRole("button", { name: "Guardar horario" }));

    expect(await within(diaLlamado("Martes")).findByText("El cierre debe ser después de la apertura.")).toBeInTheDocument();
    expect(guardarHorario).not.toHaveBeenCalled();
  });

  it("guarda el día cerrado, la noche propia del sábado y avisa que se guardó", async () => {
    vi.mocked(guardarHorario).mockResolvedValue({ tipo: "guardado", cambio: true });
    const usuario = userEvent.setup();
    render(<FormularioDeHorario consultado={conHorario()} />);

    await usuario.click(within(diaLlamado("Lunes")).getByRole("switch", { name: "Abre el lunes" }));
    await usuario.click(within(diaLlamado("Sábado")).getByRole("checkbox", { name: /Otra hora de noche/ }));
    await usuario.click(horasDe("Sábado", "Noche"));
    await usuario.keyboard("17");
    await usuario.click(screen.getByRole("button", { name: "Guardar horario" }));

    const enviado = vi.mocked(guardarHorario).mock.calls[0][0];
    expect(enviado.dias[0].abierto).toBe(false);
    expect(enviado.dias[5]).toMatchObject({ nochePropia: true, inicioDeLaNoche: "17:00" });
    expect(await screen.findByRole("status")).toHaveTextContent("Horario guardado");
    expect(navegar.refresh).toHaveBeenCalled();
  });

  it("copia el horario de un día a los demás días abiertos", async () => {
    const usuario = userEvent.setup();
    render(<FormularioDeHorario consultado={conHorario()} />);

    await usuario.click(horasDe("Viernes", "Cierra"));
    await usuario.keyboard("23");
    await usuario.click(within(diaLlamado("Viernes")).getByRole("button", { name: "Copiar a los demás días abiertos" }));

    expect(horasDe("Lunes", "Cierra")).toHaveValue("23");
    expect(within(diaLlamado("Domingo")).queryByRole("spinbutton")).not.toBeInTheDocument();
  });
});
