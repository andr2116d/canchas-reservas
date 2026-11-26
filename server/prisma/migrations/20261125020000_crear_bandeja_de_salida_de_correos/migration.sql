-- CreateEnum
CREATE TYPE "estado_de_correo" AS ENUM ('pendiente', 'enviado', 'fallido');

-- CreateTable
CREATE TABLE "correo_saliente" (
    "id" SERIAL NOT NULL,
    "destinatario_cifrado" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "texto_cifrado" TEXT NOT NULL,
    "html_cifrado" TEXT NOT NULL,
    "estado" "estado_de_correo" NOT NULL DEFAULT 'pendiente',
    "intentos" SMALLINT NOT NULL DEFAULT 0,
    "proximo_intento_en" TIMESTAMPTZ(3) NOT NULL,
    "ultimo_error" TEXT,
    "enviado_en" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "correo_saliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "correo_saliente_estado_proximo_intento_en_idx" ON "correo_saliente"("estado", "proximo_intento_en");

