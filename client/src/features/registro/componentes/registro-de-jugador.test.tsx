import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { botonCrearCuenta, campo, llenarDatosValidos, mostrarRegistro } from "../pruebas/pantalla-de-registro";
import { registrarJugador } from "../servicios/registro.api";

const reemplazarRuta = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: reemplazarRuta }),
}));
vi.mock("../servicios/registro.api", () => ({ registrarJugador: vi.fn() }));

const registrarJugadorSimulado = vi.mocked(registrarJugador);
const casillaLegal = () => screen.getByRole("checkbox", { name: /acepto los términos/i });

async function llenarYaceptar(persona: ReturnType<typeof mostrarRegistro>) {
  await llenarDatosValidos(persona);
  await persona.click(casillaLegal());
}

describe("RegistroDeJugador", () => {
  beforeEach(() => window.history.replaceState({}, "", "/registro"));
  afterEach(() => vi.clearAllMocks());

  it("muestra el título del registro sin el subtítulo", () => {
    mostrarRegistro();

    expect(screen.getByRole("heading", { name: "Crea tu cuenta de jugador" })).toBeVisible();
    expect(screen.queryByText(/te toma un minuto/i)).not.toBeInTheDocument();
  });

  it("ofrece iniciar sesión junto al título del formulario", () => {
    mostrarRegistro();

    const enlace = screen.getByRole("link", { name: "Inicia sesión" });
    const titulo = screen.getByRole("heading", { name: "Crea tu cuenta de jugador" });
    expect(screen.getByRole("main")).toContainElement(enlace);
    expect(enlace.compareDocumentPosition(titulo)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(enlace).toHaveAttribute("href", "/iniciar-sesion");
    expect(screen.queryByRole("banner")).toBeNull();
  });

  describe("campos obligatorios", () => {
    it("marca los campos obligatorios", () => {
      mostrarRegistro();

      for (const nombre of [
        "Nombres",
        "Apellidos",
        "Fecha de nacimiento",
        "Número de documento",
        "Celular",
        "Correo",
        "Contraseña",
      ]) {
        expect(campo(nombre)).toBeRequired();
      }
    });

    it("al enviar vacío señala cada campo y no envía nada", async () => {
      const persona = mostrarRegistro();

      await persona.click(botonCrearCuenta());

      expect(campo("Nombres")).toHaveAccessibleDescription("Ingresa tus nombres.");
      expect(campo("Celular")).toHaveAccessibleDescription("Ingresa tu número de celular.");
      expect(campo("Nombres")).toHaveFocus();
      expect(registrarJugadorSimulado).not.toHaveBeenCalled();
    });
  });

  describe("envío", () => {
    it("abre los documentos junto a la casilla y pide aceptar antes de enviar", async () => {
      const persona = mostrarRegistro();
      const leerDocumentos = screen.getByText("Leer términos y privacidad", { exact: true });
      const terminos = screen.getByText(/titular de la reserva debe tener 18 años/i);
      expect(terminos).not.toBeVisible();

      await persona.click(leerDocumentos);

      expect(terminos).toBeVisible();
      expect(screen.getByText(/usamos tus nombres, apellidos y documento/i)).toBeVisible();
      expect(screen.queryByText(/borrador para pruebas/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/versión registro-1/i)).not.toBeInTheDocument();
      await persona.click(leerDocumentos);
      expect(terminos).not.toBeVisible();
      expect(casillaLegal()).not.toBeChecked();
      await llenarDatosValidos(persona);

      await persona.click(botonCrearCuenta());

      expect(casillaLegal()).toHaveAccessibleDescription(/acepta los términos/i);
      expect(registrarJugadorSimulado).not.toHaveBeenCalled();
    });

    it("envía los datos y lleva al inicio del jugador", async () => {
      registrarJugadorSimulado.mockResolvedValue({ tipo: "registrado", nombres: "Valeria" });
      const persona = mostrarRegistro();
      await llenarYaceptar(persona);

      await persona.click(botonCrearCuenta());

      expect(registrarJugadorSimulado).toHaveBeenCalledWith({
        nombres: "Valeria",
        apellidos: "León Paredes",
        fechaNacimiento: "1998-05-14",
        tipoDocumento: "DNI",
        numeroDocumento: "45678912",
        celular: "987654321",
        correo: "valeria@gmail.com",
        contrasena: "pichanga10",
        dorsal: "",
        versionLegalAceptada: "registro-1",
      });
      expect(reemplazarRuta).toHaveBeenCalledWith("/inicio");
    });

    it("un doble clic envía el registro una sola vez", async () => {
      registrarJugadorSimulado.mockReturnValue(new Promise(() => undefined));
      const persona = mostrarRegistro();
      await llenarYaceptar(persona);

      await persona.dblClick(botonCrearCuenta());

      expect(registrarJugadorSimulado).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Creando tu cuenta…" })).toBeDisabled();
    });

    it("lleva al inicio aunque el enlace apunte a una reserva que aún no existe", async () => {
      window.history.replaceState({}, "", "/registro?siguiente=/reservar/la-popular");
      registrarJugadorSimulado.mockResolvedValue({ tipo: "registrado", nombres: "Valeria" });
      const persona = mostrarRegistro();
      await llenarYaceptar(persona);

      await persona.click(botonCrearCuenta());

      expect(reemplazarRuta).toHaveBeenCalledWith("/inicio");
    });

    it("muestra junto al campo que ya existe una cuenta con ese correo", async () => {
      registrarJugadorSimulado.mockResolvedValue({
        tipo: "datos-rechazados",
        errores: { correo: "Ya existe una cuenta con este correo." },
      });
      const persona = mostrarRegistro();
      await llenarYaceptar(persona);

      await persona.click(botonCrearCuenta());

      expect(campo("Correo")).toHaveAccessibleDescription(
        "Ya existe una cuenta con este correo.",
      );
      expect(campo("Correo")).toHaveFocus();
      expect(reemplazarRuta).not.toHaveBeenCalled();
    });

    it("muestra el aviso general cuando el server rechaza el intento", async () => {
      registrarJugadorSimulado.mockResolvedValue({
        tipo: "error",
        mensaje: "Hiciste demasiados intentos. Espera un momento y vuelve a intentarlo.",
      });
      const persona = mostrarRegistro();
      await llenarYaceptar(persona);

      await persona.click(botonCrearCuenta());

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Hiciste demasiados intentos. Espera un momento y vuelve a intentarlo.",
      );
    });
  });

  describe("ayudas", () => {
    it("permite mostrar y ocultar la contraseña", async () => {
      const persona = mostrarRegistro();

      await persona.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
      expect(campo("Contraseña")).toHaveAttribute("type", "text");

      await persona.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
      expect(campo("Contraseña")).toHaveAttribute("type", "password");
    });

    it("el dorsal es opcional y lo dice en su etiqueta", () => {
      mostrarRegistro();

      expect(campo("Dorsal")).not.toBeRequired();
      expect(screen.getByText("(opcional)")).toBeVisible();
    });

    it("muestra en la ficha el dorsal elegido", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Dorsal"), "10");

      expect(screen.getByTestId("ficha-dorsal")).toHaveTextContent("10");
    });

    it("llena la ficha de jugador con el nombre mientras se escribe", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Nombres"), "Valeria");

      expect(screen.getByTestId("ficha-nombres")).toHaveTextContent("Valeria");
    });
  });
});
