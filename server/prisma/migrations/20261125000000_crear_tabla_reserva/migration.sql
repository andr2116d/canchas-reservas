-- CreateEnum
CREATE TYPE "estado_de_reserva" AS ENUM ('pendiente_de_pago', 'pendiente_de_validacion', 'confirmada', 'en_juego');

-- CreateTable
CREATE TABLE "reserva" (
    "id" SERIAL NOT NULL,
    "cancha_id" INTEGER NOT NULL,
    "titular_id" INTEGER NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fin" TIMESTAMPTZ(3) NOT NULL,
    "estado" "estado_de_reserva" NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reserva_cancha_id_inicio_idx" ON "reserva"("cancha_id", "inicio");

-- CreateIndex
CREATE INDEX "reserva_inicio_idx" ON "reserva"("inicio");

-- CreateIndex
CREATE INDEX "reserva_titular_id_idx" ON "reserva"("titular_id");

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_titular_id_fkey" FOREIGN KEY ("titular_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Una reserva termina después de empezar.
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_rango_check" CHECK ("fin" > "inicio");

-- Dos reservas que ocupan su turno no se pisan en la misma cancha. Las etapas que no lo ocupen
-- (como una cancelación) quedarán fuera de esta lista.
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_sin_cruces_excl"
  EXCLUDE USING gist ("cancha_id" WITH =, tstzrange("inicio", "fin") WITH &&)
  WHERE ("estado" IN ('pendiente_de_pago', 'pendiente_de_validacion', 'confirmada', 'en_juego'));
