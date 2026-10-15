import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/campo";
import { Logo } from "@/components/layout/logo";

export default function PaginaRegistro() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fondo px-4 py-8">
      <Card className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center gap-2 pb-2">
          <Logo className="text-2xl text-noche-900" />
          <h1 className="font-display text-3xl font-bold text-noche-900">
            Crear cuenta
          </h1>
          <p className="text-sm text-texto-suave">
            Completa tus datos para registrarte
          </p>
        </div>

        <form className="flex flex-col gap-4" noValidate>
          <Input etiqueta="Nombres" name="nombres" />
          <Input etiqueta="Apellidos" name="apellidos" />

          <Select etiqueta="Tipo de documento" name="tipoDocumento">
            <option value="DNI">DNI</option>
            <option value="CE">Carné de extranjería</option>
          </Select>

          <Input etiqueta="Número de documento" name="numeroDocumento" />
          <Input etiqueta="Correo electrónico" name="correo" type="email" />
          <Input etiqueta="Celular" name="telefono" />
          <Input etiqueta="Contraseña" name="contrasena" type="password" />
          <Input
            etiqueta="Confirmar contraseña"
            name="confirmacion"
            type="password"
          />

          <Button type="submit" className="w-full">
            Crear cuenta
          </Button>

          <p className="text-center text-sm text-texto-suave">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-cesped-600 font-medium hover:text-cesped-700">
              Inicia sesión
            </Link>
          </p>
        </form>
      </Card>
    </main>
  );
}
