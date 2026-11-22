import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registrarJugador } from "../servicios/registro.api";
import { RegistroDeJugador } from "./registro-de-jugador";

const reemplazarRuta = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: reemplazarRuta }),
}));
vi.mock("../servicios/registro.api", () => ({ registrarJugador: vi.fn() }));

const registrarJugadorSimulado = vi.mocked(registrarJugador);

function mostrarRegistro() {
  const persona = userEvent.setup();
  render(<RegistroDeJugador />);
  return persona;
}

// La etiqueta visible lleva un asterisco al final; se busca por su comienzo.
const campo = (nombre: string) => screen.getByLabelText(new RegExp(`^${nombre}`));

async function llenarDatosValidos(persona: ReturnType<typeof userEvent.setup>) {
  await persona.type(campo("Nombres"), "Valeria");
  await persona.type(campo("Apellidos"), "León Paredes");
  await persona.type(campo("Número de documento"), "45678912");
  await persona.type(campo("Celular"), "987654321");
  await persona.type(campo("Correo"), "valeria@gmail.com");
  await persona.type(campo("Contraseña"), "pichanga10");
}

const botonCrearCuenta = () => screen.getByRole("button", { name: "Crear mi cuenta" });

describe("RegistroDeJugador", () => {
  beforeEach(() => window.history.replaceState({}, "", "/registro"));
  afterEach(() => vi.clearAllMocks());

  describe("campos obligatorios", () => {
    it("marca todos los campos como obligatorios y lo dice en pantalla", () => {
      mostrarRegistro();

      expect(screen.getByText("Todos los datos son obligatorios.")).toBeVisible();
      for (const nombre of [
        "Nombres",
        "Apellidos",
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

  describe("validación mientras se escribe", () => {
    it("avisa de inmediato que el DNI no admite letras", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Número de documento"), "4567891A");

      expect(campo("Número de documento")).toHaveAccessibleDescription(
        "El DNI solo debe contener números.",
      );
      expect(campo("Número de documento")).toHaveAttribute("aria-invalid", "true");
    });

    it("avisa que el celular debe empezar con 9", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Celular"), "044123456");

      expect(campo("Celular")).toHaveAccessibleDescription("El celular debe empezar con 9.");
    });

    it("avisa que la contraseña necesita un número", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Contraseña"), "pichanga");

      expect(campo("Contraseña")).toHaveAccessibleDescription(
        expect.stringContaining("La contraseña debe incluir al menos un número."),
      );
    });

    it("quita el error cuando el dato queda bien", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Celular"), "98765432");
      await persona.type(campo("Celular"), "1");

      expect(campo("Celular")).toHaveAttribute("aria-invalid", "false");
    });

    it("aplica las reglas del carné de extranjería al cambiar de documento", async () => {
      const persona = mostrarRegistro();
      await persona.type(campo("Número de documento"), "AB1234567");

      await persona.click(screen.getByRole("radio", { name: "Carné de extranjería" }));

      expect(campo("Número de documento")).toHaveAttribute("aria-invalid", "false");
      await persona.click(screen.getByRole("radio", { name: "DNI" }));
      expect(campo("Número de documento")).toHaveAccessibleDescription(
        "El DNI solo debe contener números.",
      );
    });
  });

  describe("envío", () => {
    it("envía los datos y lleva al inicio del jugador", async () => {
      registrarJugadorSimulado.mockResolvedValue({ tipo: "registrado", nombres: "Valeria" });
      const persona = mostrarRegistro();
      await llenarDatosValidos(persona);

      await persona.click(botonCrearCuenta());

      expect(registrarJugadorSimulado).toHaveBeenCalledWith({
        nombres: "Valeria",
        apellidos: "León Paredes",
        tipoDocumento: "DNI",
        numeroDocumento: "45678912",
        celular: "987654321",
        correo: "valeria@gmail.com",
        contrasena: "pichanga10",
      });
      expect(reemplazarRuta).toHaveBeenCalledWith("/inicio");
    });

    it("un doble clic envía el registro una sola vez", async () => {
      registrarJugadorSimulado.mockReturnValue(new Promise(() => undefined));
      const persona = mostrarRegistro();
      await llenarDatosValidos(persona);

      await persona.dblClick(botonCrearCuenta());

      expect(registrarJugadorSimulado).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Creando tu cuenta…" })).toBeDisabled();
    });

    it("vuelve a la reserva pendiente si llegó desde ese flujo", async () => {
      window.history.replaceState({}, "", "/registro?siguiente=/reservar/la-popular");
      registrarJugadorSimulado.mockResolvedValue({ tipo: "registrado", nombres: "Valeria" });
      const persona = mostrarRegistro();
      await llenarDatosValidos(persona);

      await persona.click(botonCrearCuenta());

      expect(reemplazarRuta).toHaveBeenCalledWith("/reservar/la-popular");
    });

    it("muestra junto al campo que ya existe una cuenta con ese correo", async () => {
      registrarJugadorSimulado.mockResolvedValue({
        tipo: "datos-rechazados",
        errores: { correo: "Ya existe una cuenta con este correo." },
      });
      const persona = mostrarRegistro();
      await llenarDatosValidos(persona);

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
      await llenarDatosValidos(persona);

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

    it("llena la ficha de jugador con el nombre mientras se escribe", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Nombres"), "Valeria");

      expect(screen.getByTestId("ficha-nombres")).toHaveTextContent("Valeria");
    });
  });
});
