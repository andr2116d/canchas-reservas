import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800-italic.css";
import { Proveedores } from "@/components/proveedores";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Previa",
  description: "Reserva tu cancha de fútbol 5 y 7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <Proveedores>{children}</Proveedores>
      </body>
    </html>
  );
}
