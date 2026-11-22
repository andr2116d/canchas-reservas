import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { campo, mostrarRegistro } from "../pruebas/pantalla-de-registro";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("../servicios/registro.api", () => ({ registrarJugador: vi.fn() }));

describe("Registro: validación y restricciones mientras se escribe", () => {
    it("con DNI no deja escribir letras ni otros caracteres", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Número de documento"), "45A6-78 9B12");

      expect(campo("Número de documento")).toHaveValue("45678912");
      expect(campo("Número de documento")).toHaveAttribute("aria-invalid", "false");
    });

    it("con DNI avisa mientras falten dígitos", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Número de documento"), "4567");

      expect(campo("Número de documento")).toHaveAccessibleDescription(
        "El DNI debe tener 8 dígitos.",
      );
    });

    it("con carné de extranjería sí deja escribir letras", async () => {
      const persona = mostrarRegistro();
      await persona.click(screen.getByRole("radio", { name: "Carné de extranjería" }));

      await persona.type(campo("Número de documento"), "AB1234567");

      expect(campo("Número de documento")).toHaveValue("AB1234567");
      expect(campo("Número de documento")).toHaveAttribute("aria-invalid", "false");
    });

    it("con DNI no deja pasar de 8 dígitos", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Número de documento"), "4567891234");

      expect(campo("Número de documento")).toHaveValue("45678912");
    });

    it("con DNI limpia lo pegado sin perder dígitos", async () => {
      const persona = mostrarRegistro();
      await persona.click(campo("Número de documento"));

      await persona.paste("4567-8912");

      expect(campo("Número de documento")).toHaveValue("45678912");
    });

    it("con carné acepta solo letras y números, en mayúscula y hasta 12", async () => {
      const persona = mostrarRegistro();
      await persona.click(screen.getByRole("radio", { name: "Carné de extranjería" }));

      await persona.type(campo("Número de documento"), "ab-12 3456789012345");

      expect(campo("Número de documento")).toHaveValue("AB1234567890");
    });

    it("el celular solo acepta números y hasta 9", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Celular"), "98a7 654-32109");

      expect(campo("Celular")).toHaveValue("987654321");
    });

    it("ningún campo deja escribir más de lo que acepta", () => {
      mostrarRegistro();

      expect(campo("Nombres")).toHaveAttribute("maxLength", "80");
      expect(campo("Apellidos")).toHaveAttribute("maxLength", "80");
      expect(campo("Correo")).toHaveAttribute("maxLength", "254");
      expect(campo("Contraseña")).toHaveAttribute("maxLength", "64");
    });

    it("avisa de inmediato si la persona es menor de 18 años", async () => {
      const persona = mostrarRegistro();

      await persona.type(campo("Fecha de nacimiento"), "2015-06-01");

      expect(campo("Fecha de nacimiento")).toHaveAccessibleDescription(
        "Debes tener al menos 18 años para crear tu cuenta.",
      );
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

    it("al cambiar a DNI vacía el número escrito para el carné", async () => {
      const persona = mostrarRegistro();
      await persona.click(screen.getByRole("radio", { name: "Carné de extranjería" }));
      await persona.type(campo("Número de documento"), "AB1234567");

      await persona.click(screen.getByRole("radio", { name: "DNI" }));

      expect(campo("Número de documento")).toHaveValue("");
      expect(campo("Número de documento")).toHaveAttribute("aria-invalid", "false");
    });

    it("al cambiar a carné conserva los dígitos y aplica sus reglas", async () => {
      const persona = mostrarRegistro();
      await persona.type(campo("Número de documento"), "4567891");

      await persona.click(screen.getByRole("radio", { name: "Carné de extranjería" }));

      expect(campo("Número de documento")).toHaveValue("4567891");
      expect(campo("Número de documento")).toHaveAccessibleDescription(
        "El carné de extranjería debe tener entre 9 y 12 caracteres.",
      );
    });
});
