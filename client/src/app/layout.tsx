import type { Metadata } from "next";
import localFont from "next/font/local";
import { MarcaDeCargaInicial } from "@/compartido/ui/marca-de-carga-inicial";
import "./globals.css";

const bigShoulders = localFont({
  src: "./fuentes/big-shoulders.woff2",
  weight: "700 900",
  variable: "--fuente-big-shoulders",
  display: "swap",
});

const instrumentSans = localFont({
  src: "./fuentes/instrument-sans.woff2",
  weight: "400 700",
  variable: "--fuente-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "La Previa",
  description: "Reserva tu cancha de fútbol 5 y 7 en Trujillo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${bigShoulders.variable} ${instrumentSans.variable}`}>
      <body className="min-h-dvh font-texto antialiased">
        <MarcaDeCargaInicial />
        {children}
      </body>
    </html>
  );
}
