import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Autor, PaginaDelHistorial, Registro } from "../servicios/historial";
import { FILTROS_INICIALES, type Filtros } from "../utilidades/filtros";
import { ConsultaDelHistorial } from "./consulta-del-historial";
import { FiltrosDelHistorial } from "./filtros-del-historial";
import { LineaDeTiempo } from "./linea-de-tiempo";
import { PaginacionDelHistorial, ResumenDeResultados } from "./paginacion-del-historial";
import { PeriodoDelHistorial } from "./periodo-del-historial";

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
    <ConsultaDelHistorial filtros={filtros} hoy="2026-11-24">
      <PeriodoDelHistorial />
      <FiltrosDelHistorial autores={AUTORES} aviso={aviso} />
    </ConsultaDelHistorial>,
  );
  return userEvent.setup();
}

const categoria = (nombre: string) => within(screen.getByRole("group", { name: "Categoría" })).getByRole("button", { name: nombre });

describe("Historial de cambios", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  describe("filtros", () => {
    it("dos cambios seguidos se suman aunque la página aún no llegue", async () => {
      const usuario = mostrarFiltros();

      await usuario.click(categoria("Adicionales"));
      await usuario.selectOptions(screen.getByLabelText("Acción"), "EDICION");

      expect(navegar.push).toHaveBeenLastCalledWith("?categoria=ADICIONALES&accion=EDICION", { scroll: false });
      expect(categoria("Adicionales")).toHaveAttribute("aria-pressed", "true");
    });

    it("combina filtros y vuelve a la primera página", async () => {
      const usuario = mostrarFiltros({ ...FILTROS_INICIALES, pagina: 3 });

      await usuario.click(categoria("Canchas"));

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
      expect(navegar.push).toHaveBeenLastCalledWith("?autor=9&importantes=1", { scroll: false });
      await usuario.click(screen.getByRole("button", { name: "Más antiguos" }));
      expect(navegar.push).toHaveBeenLastCalledWith("?autor=9&importantes=1&orden=antiguos", { scroll: false });
    });

    it("los atajos de período eligen fechas de Lima y marcan el elegido", async () => {
      const usuario = mostrarFiltros();
      const periodo = screen.getByRole("group", { name: "Período" });

      expect(within(periodo).getByRole("button", { name: "Todo" })).toHaveAttribute("aria-pressed", "true");
      await usuario.click(within(periodo).getByRole("button", { name: "7 días" }));

      expect(navegar.push).toHaveBeenLastCalledWith("?desde=2026-11-18&hasta=2026-11-24", { scroll: false });
      expect(within(periodo).getByRole("button", { name: "7 días" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByLabelText("Desde")).toHaveValue("2026-11-18");
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

    it("lo que hace el sistema, como una reserva que vence, se lee con el autor «Sistema»", () => {
      const vencida: Registro = {
        id: "vencimiento-3",
        ocurridoEn: "2026-11-24T15:16:00.000Z",
        categoria: "RESERVAS",
        accion: "EXPIRACION",
        importante: false,
        autor: { id: null, nombre: "Sistema" },
        sujeto: "Reserva 7K3Q9X",
        detalle: [],
      };

      render(<LineaDeTiempo pagina={pagina({ registros: [vencida], total: 1 })} hoy="2026-11-24" />);

      expect(screen.getByRole("listitem")).toHaveTextContent("10:16Sistema dio por vencida la Reserva 7K3Q9X");
      expect(screen.getByText("Reservas")).toBeInTheDocument();
    });

    it("el detalle muestra el antes y el después", () => {
      render(<LineaDeTiempo pagina={pagina()} hoy="2026-11-24" />);

      const fila = screen.getByRole("row", { name: /Precio de día/ });
      expect(fila).toHaveTextContent("Precio de díaS/ 50.00S/ 55.00");
    });

    it("sin registros que cumplan los filtros, lo dice", () => {
      render(
        <ConsultaDelHistorial filtros={FILTROS_INICIALES} hoy="2026-11-24">
          <LineaDeTiempo pagina={pagina({ registros: [], total: 0, paginas: 0 })} hoy="2026-11-24" />
        </ConsultaDelHistorial>,
      );

      expect(screen.getByRole("heading", { name: "No hay registros con estos filtros" })).toBeInTheDocument();
    });
  });

  describe("paginación", () => {
    function mostrarPaginas(cambios: Partial<PaginaDelHistorial>) {
      render(
        <ConsultaDelHistorial filtros={{ ...FILTROS_INICIALES, pagina: cambios.pagina ?? 1 }} hoy="2026-11-24">
          <ResumenDeResultados pagina={pagina(cambios)} />
          <PaginacionDelHistorial pagina={pagina(cambios)} />
        </ConsultaDelHistorial>,
      );
      return userEvent.setup();
    }

    it("dice qué registros se ven y cuántos hay, y avanza de página", async () => {
      const usuario = mostrarPaginas({ total: 60, pagina: 2, paginas: 3 });

      expect(screen.getByText("26–50")).toBeInTheDocument();
      expect(screen.getByText("de 60 registros")).toBeInTheDocument();
      await usuario.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(navegar.push).toHaveBeenLastCalledWith("?pagina=3", { scroll: false });
    });

    it("con muchas páginas muestra la primera, la última y las cercanas", () => {
      mostrarPaginas({ total: 300, pagina: 6, paginas: 12 });

      const numeros = within(screen.getByRole("navigation", { name: "Páginas del historial" }))
        .getAllByRole("button", { name: /^Página \d+$/ })
        .map((b) => b.textContent);
      expect(numeros).toEqual(["1", "5", "6", "7", "12"]);
      expect(screen.getByRole("button", { name: "Página 6" })).toHaveAttribute("aria-current", "page");
    });

    it("elige cuántos registros mostrar por página", async () => {
      const usuario = mostrarPaginas({ total: 60, paginas: 3 });

      await usuario.click(within(screen.getByRole("group", { name: "Por página" })).getByRole("button", { name: "50" }));

      expect(navegar.push).toHaveBeenLastCalledWith("?porPagina=50", { scroll: false });
    });
  });
});
