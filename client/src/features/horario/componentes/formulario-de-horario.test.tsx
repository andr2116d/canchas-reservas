import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorDelBorrador } from "@/compartido/horario/borrador";
import type { HorarioConsultado } from "@/compartido/horario/horario";
import { guardarHorario } from "../servicios/horario.api";
import { FormularioDeHorario } from "./formulario-de-horario";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/horario.api", () => ({ guardarHorario: vi.fn() }));
vi.mock("@/compartido/horario/simulacion.api", () => ({ simularTurnos: vi.fn().mockResolvedValue({ tipo: "simulado", simulacion: { tipos: {} } }) }));

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;

function conHorario(): HorarioConsultado {
  const vigente = {
    inicioDeLaNoche: "18:00",
    dias: DIAS.map((dia) => (dia === "DOMINGO" ? { dia, abierto: false } : { dia, abierto: true, abre: "08:00", cierra: "22:00" })),
    guardadoEn: "2026-11-23T01:30:00.000Z",
    guardadoPor: "Valeria León",
  };
  return { vigente, historial: [vigente], inicioDeLaNochePorDefecto: "18:00" };
}

function mostrar(consultado = conHorario()) {
  render(
    <ProveedorDelBorrador>
      <FormularioDeHorario consultado={consultado} />
    </ProveedorDelBorrador>,
  );
}

const general = (etiqueta: string) => screen.getByRole("spinbutton", { name: `Horas de ${etiqueta}` });
const chip = (dia: string) => screen.getByRole("button", { name: `Abre el ${dia}` });
const semana = () => screen.getByRole("list", { name: "Así queda la semana" });

describe("FormularioDeHorario", () => {
  beforeEach(() => vi.mocked(guardarHorario).mockReset());

  it("muestra un solo horario para los días que abre, el domingo cerrado y desde cuándo rige", () => {
    mostrar();

    expect(general("Abre")).toHaveValue("08");
    expect(general("Cierra")).toHaveValue("22");
    expect(chip("lunes")).toHaveAttribute("aria-pressed", "true");
    expect(chip("domingo")).toHaveAttribute("aria-pressed", "false");
    expect(within(semana()).getAllByRole("listitem")[6]).toHaveTextContent("DomCerrado");
    expect(screen.getByText(/Vigente desde/)).toHaveTextContent("Vigente desde 22 nov 2026, 20:30 · por Valeria León");
  });

  it("sin horario guardado avisa que todavía no se ofrecen turnos", () => {
    mostrar({ historial: [], inicioDeLaNochePorDefecto: "18:00" });

    expect(screen.getByText(/Todavía no hay horario guardado/)).toBeInTheDocument();
  });

  it("los atajos eligen varios días de una vez", async () => {
    mostrar();

    await userEvent.click(screen.getByRole("button", { name: "Lunes a viernes" }));

    expect(chip("sábado")).toHaveAttribute("aria-pressed", "false");
    expect(chip("viernes")).toHaveAttribute("aria-pressed", "true");
  });

  it("un día distinto se agrega solo si se pide y se puede devolver al horario general", async () => {
    const usuario = userEvent.setup();
    mostrar();
    expect(screen.queryByRole("group", { name: "Sábado" })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "¿Algún día abre a otra hora?" }));
    await usuario.click(screen.getByRole("button", { name: "Sáb" }));
    const sabado = screen.getByRole("group", { name: "Sábado" });
    expect(within(sabado).getByRole("spinbutton", { name: "Horas de Noche desde" })).toHaveValue("18");

    await usuario.click(within(sabado).getByRole("button", { name: "Igual que los demás" }));
    expect(screen.queryByRole("group", { name: "Sábado" })).not.toBeInTheDocument();
  });

  it("no deja guardar un cierre anterior a la apertura", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(general("Cierra"));
    await usuario.keyboard("07");
    await usuario.click(screen.getByRole("button", { name: "Guardar horario" }));

    expect(await screen.findByText("El cierre debe ser después de la apertura.")).toBeInTheDocument();
    expect(guardarHorario).not.toHaveBeenCalled();
  });

  it("guarda los días que abre y la noche propia del sábado, y avisa que rige para las reservas nuevas", async () => {
    vi.mocked(guardarHorario).mockResolvedValue({ tipo: "guardado", cambio: true });
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(chip("lunes"));
    await usuario.click(screen.getByRole("button", { name: "¿Algún día abre a otra hora?" }));
    await usuario.click(screen.getByRole("button", { name: "Sáb" }));
    await usuario.click(within(screen.getByRole("group", { name: "Sábado" })).getByRole("spinbutton", { name: "Horas de Noche desde" }));
    await usuario.keyboard("17");
    await usuario.click(screen.getByRole("button", { name: "Guardar horario" }));

    const { dias } = vi.mocked(guardarHorario).mock.calls[0][0];
    expect(dias[0]).toEqual({ dia: "LUNES", abierto: false });
    expect(dias[5]).toEqual({ dia: "SABADO", abierto: true, abre: "08:00", cierra: "22:00", inicioDeLaNoche: "17:00" });
    expect(await screen.findByRole("status")).toHaveTextContent("las reservas ya hechas no cambian");
    expect(navegar.refresh).toHaveBeenCalled();
  });
});
