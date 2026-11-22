-- CreateEnum
CREATE TYPE "tipo_documento" AS ENUM ('dni', 'carne_extranjeria');

-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('jugador');

-- CreateEnum
CREATE TYPE "estado_usuario" AS ENUM ('activo');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nombres_cifrado" TEXT NOT NULL,
    "apellidos_cifrado" TEXT NOT NULL,
    "tipo_documento" "tipo_documento" NOT NULL,
    "numero_documento_cifrado" TEXT NOT NULL,
    "documento_hash" TEXT NOT NULL,
    "correo_cifrado" TEXT NOT NULL,
    "correo_hash" TEXT NOT NULL,
    "celular_cifrado" TEXT NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "rol" "rol_usuario" NOT NULL,
    "estado" "estado_usuario" NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_documento_hash_key" ON "usuario"("documento_hash");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_hash_key" ON "usuario"("correo_hash");
