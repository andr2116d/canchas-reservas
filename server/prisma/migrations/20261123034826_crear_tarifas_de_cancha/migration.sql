-- CreateEnum
CREATE TYPE "tipo_de_cancha" AS ENUM ('futbol_5', 'futbol_7');

-- CreateTable
CREATE TABLE "tarifa_de_cancha" (
    "id" SERIAL NOT NULL,
    "tipo_de_cancha" "tipo_de_cancha" NOT NULL,
    "precio_dia" DECIMAL(10,2) NOT NULL,
    "precio_noche" DECIMAL(10,2) NOT NULL,
    "duracion_del_turno_horas" SMALLINT NOT NULL,
    "guardada_por_id" INTEGER NOT NULL,
    "guardada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarifa_de_cancha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tarifa_de_cancha_tipo_de_cancha_guardada_en_idx" ON "tarifa_de_cancha"("tipo_de_cancha", "guardada_en");

-- AddForeignKey
ALTER TABLE "tarifa_de_cancha" ADD CONSTRAINT "tarifa_de_cancha_guardada_por_id_fkey" FOREIGN KEY ("guardada_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Toda tarifa es mayor que cero y el turno dura de 1 a 12 horas enteras.
ALTER TABLE "tarifa_de_cancha"
  ADD CONSTRAINT "tarifa_de_cancha_precios_positivos_check" CHECK ("precio_dia" > 0 AND "precio_noche" > 0),
  ADD CONSTRAINT "tarifa_de_cancha_duracion_del_turno_check" CHECK ("duracion_del_turno_horas" BETWEEN 1 AND 12);
