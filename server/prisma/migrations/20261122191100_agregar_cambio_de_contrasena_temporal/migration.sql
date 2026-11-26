ALTER TABLE usuario ADD COLUMN requiere_cambiar_contrasena BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX sesion_usuario_id_idx ON sesion (usuario_id);
