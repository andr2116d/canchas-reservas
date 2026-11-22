import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Previa",
  description: "Reserva tu cancha de fútbol 5 y 7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
