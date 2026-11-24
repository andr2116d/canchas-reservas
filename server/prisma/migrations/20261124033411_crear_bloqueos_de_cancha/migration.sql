-- CreateEnum
CREATE TYPE "tipo_de_bloqueo" AS ENUM ('programado', 'emergencia');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "accion_sobre_cancha" ADD VALUE 'bloqueo';
ALTER TYPE "accion_sobre_cancha" ADD VALUE 'liberacion_de_bloqueo';
ALTER TYPE "accion_sobre_cancha" ADD VALUE 'retiro_de_bloqueo';

-- CreateTable
CREATE TABLE "bloqueo_de_cancha" (
    "id" SERIAL NOT NULL,
    "cancha_id" INTEGER NOT NULL,
    "tipo" "tipo_de_bloqueo" NOT NULL,
    "motivo" TEXT NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fin" TIMESTAMPTZ(3) NOT NULL,
    "liberado_en" TIMESTAMPTZ(3),
    "creado_por_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueo_de_cancha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bloqueo_de_cancha_cancha_id_inicio_idx" ON "bloqueo_de_cancha"("cancha_id", "inicio");

-- CreateIndex
CREATE INDEX "bloqueo_de_cancha_fin_idx" ON "bloqueo_de_cancha"("fin");

-- AddForeignKey
ALTER TABLE "bloqueo_de_cancha" ADD CONSTRAINT "bloqueo_de_cancha_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "cancha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueo_de_cancha" ADD CONSTRAINT "bloqueo_de_cancha_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Fin posterior al inicio, motivo de 1 a 200 caracteres y liberación dentro del rango.
ALTER TABLE "bloqueo_de_cancha" ADD CONSTRAINT "bloqueo_de_cancha_rango_check" CHECK ("fin" > "inicio");
ALTER TABLE "bloqueo_de_cancha" ADD CONSTRAINT "bloqueo_de_cancha_motivo_check" CHECK (char_length("motivo") BETWEEN 1 AND 200);
ALTER TABLE "bloqueo_de_cancha" ADD CONSTRAINT "bloqueo_de_cancha_liberado_en_check" CHECK ("liberado_en" IS NULL OR ("liberado_en" >= "inicio" AND "liberado_en" <= "fin"));

-- Dos bloqueos de la misma cancha no se pisan, aunque se guarden al mismo tiempo.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "bloqueo_de_cancha" ADD CONSTRAINT "bloqueo_de_cancha_sin_cruces_excl"
  EXCLUDE USING gist ("cancha_id" WITH =, tstzrange("inicio", COALESCE("liberado_en", "fin")) WITH &&);
