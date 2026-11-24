import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Autor, PaginaDelHistorial, Registro } from "../servicios/historial";
import { FILTROS_INICIALES, type Filtros } from "../utilidades/filtros";
import { ConsultaDelHistorial } from "./consulta-del-historial";
import { FiltrosDelHistorial } from "./filtros-del-historial";
import { LineaDeTiempo } from "./linea-de-tiempo";
import { PaginacionDelHistorial } from "./paginacion-del-historial";

const navegar = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));

const AUTORES: Autor[] = [
  { id: 7, nombre: "Valeria León", rol: "ADMINISTRADOR" },
  { id: 9, nombre: "Rosa Díaz", rol: "RECEPCIONISTA" },
];

const TARIFA: Registro = {
  id: "tarifa-2",
  ocurridoEn: "2026-11-24T15:42:00.000Z",
  categoria: "TARIFAS",
  accion: "EDICION",
  importante: true,
  autor: { id: 7, nombre: "Valeria León" },
  sujeto: "Fútbol 7",
  detalle: [{ campo: "Precio de día", antes: "S/ 50.00", despues: "S/ 55.00" }],
};

const ACCESO: Registro = {
  id: "acceso-1",
  ocurridoEn: "2026-11-23T13:05:00.000Z",
  categoria: "ACCESOS",
  accion: "INICIO_DE_SESION",
  importante: false,
  autor: { id: 9, nombre: "Rosa Díaz" },
  sujeto: null,
  detalle: [],
};

const pagina = (cambios: Partial<PaginaDelHistorial> = {}): PaginaDelHistorial => ({
  registros: [TARIFA, ACCESO],
  total: 2,
  pagina: 1,
  porPagina: 25,
  paginas: 1,
  ...cambios,
});

function mostrarFiltros(filtros: Filtros = FILTROS_INICIALES, aviso?: string) {
  render(
    <ConsultaDelHistorial>
      <FiltrosDelHistorial filtros={filtros} autores={AUTORES} aviso={aviso} />
    </ConsultaDelHistorial>,
  );
  return userEvent.setup();
}

describe("Historial de cambios", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  describe("filtros", () => {
    it("combina filtros y vuelve a la primera página", async () => {
      const usuario = mostrarFiltros({ ...FILTROS_INICIALES, pagina: 3 });

      await usuario.selectOptions(screen.getByLabelText("Categoría"), "CANCHAS");

      expect(navegar.push).toHaveBeenLastCalledWith("?categoria=CANCHAS", { scroll: false });
    });

    it("ofrece solo las acciones de la categoría elegida", () => {
      mostrarFiltros({ ...FILTROS_INICIALES, categoria: "MANTENIMIENTO" });

      const acciones = within(screen.getByLabelText("Acción")).getAllByRole("option").map((o) => o.textContent);
      expect(acciones).toEqual(["Todas", "Bloqueo", "Liberación de bloqueo", "Retiro de bloqueo"]);
    });

    it("filtra por persona, solo importantes y orden", async () => {
      const usuario = mostrarFiltros();

      await usuario.selectOptions(screen.getByLabelText("Persona"), "9");
      expect(navegar.push).toHaveBeenLastCalledWith("?autor=9", { scroll: false });
      await usuario.click(screen.getByRole("button", { name: "Solo importantes" }));
      expect(navegar.push).toHaveBeenLastCalledWith("?importantes=1", { scroll: false });
      await usuario.click(screen.getByRole("button", { name: "Más antiguos" }));
      expect(navegar.push).toHaveBeenLastCalledWith("?orden=antiguos", { scroll: false });
    });

    it("si la fecha final es anterior a la inicial no filtra y dice por qué", async () => {
      const usuario = mostrarFiltros({ ...FILTROS_INICIALES, desde: "2026-11-24" });

      await usuario.type(screen.getByLabelText("Hasta"), "2026-11-20");

      expect(screen.getByRole("alert")).toHaveTextContent("La fecha final es anterior a la inicial");
      expect(navegar.push).not.toHaveBeenCalled();
    });

    it("muestra el aviso que llega de la dirección y limpia los filtros", async () => {
      const usuario = mostrarFiltros({ ...FILTROS_INICIALES, categoria: "TARIFAS" }, "La fecha final es anterior a la inicial, así que no se filtró por fechas.");

      expect(screen.getByRole("alert")).toHaveTextContent("no se filtró por fechas");
      await usuario.click(screen.getByRole("button", { name: "Limpiar filtros" }));

      expect(navegar.push).toHaveBeenLastCalledWith("?", { scroll: false });
    });
  });

  describe("línea de tiempo", () => {
    it("agrupa por día y dice quién hizo qué, cuándo y si es importante", () => {
      render(<LineaDeTiempo pagina={pagina()} hoy="2026-11-24" />);

      const [hoy, ayer] = screen.getAllByRole("region");
      expect(within(hoy).getByRole("heading")).toHaveTextContent("Hoy");
      expect(within(hoy).getByRole("listitem")).toHaveTextContent("10:42Valeria León cambió la tarifa de Fútbol 7");
      expect(within(hoy).getByText("Importante")).toBeInTheDocument();
      expect(within(hoy).getByText("Tarifas")).toBeInTheDocument();
      expect(within(ayer).getByRole("listitem")).toHaveTextContent("08:05Rosa Díaz inició sesión");
    });

    it("el detalle muestra el antes y el después", () => {
      render(<LineaDeTiempo pagina={pagina()} hoy="2026-11-24" />);

      const fila = screen.getByRole("row", { name: /Precio de día/ });
      expect(fila).toHaveTextContent("Precio de díaS/ 50.00S/ 55.00");
    });

    it("sin registros que cumplan los filtros, lo dice", () => {
      render(
        <ConsultaDelHistorial>
          <LineaDeTiempo pagina={pagina({ registros: [], total: 0, paginas: 0 })} hoy="2026-11-24" />
        </ConsultaDelHistorial>,
      );

      expect(screen.getByRole("heading", { name: "No hay registros con estos filtros" })).toBeInTheDocument();
    });
  });

  describe("paginación", () => {
    it("dice qué registros se ven y avanza de página", async () => {
      render(
        <ConsultaDelHistorial>
          <PaginacionDelHistorial pagina={pagina({ total: 60, pagina: 2, paginas: 3 })} filtros={{ ...FILTROS_INICIALES, pagina: 2 }} />
        </ConsultaDelHistorial>,
      );

      expect(screen.getByText("26–50 de 60")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
      expect(navegar.push).toHaveBeenLastCalledWith("?pagina=3", { scroll: false });
      await userEvent.selectOptions(screen.getByLabelText("Por página"), "50");
      expect(navegar.push).toHaveBeenLastCalledWith("?porPagina=50", { scroll: false });
    });
  });
});
