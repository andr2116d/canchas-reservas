/*
  Warnings:

  - Added the required column `fecha_nacimiento_cifrada` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "fecha_nacimiento_cifrada" TEXT NOT NULL;
