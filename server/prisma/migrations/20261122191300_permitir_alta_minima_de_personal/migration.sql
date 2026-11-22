ALTER TABLE usuario
    ALTER COLUMN fecha_nacimiento_cifrada DROP NOT NULL,
    ALTER COLUMN tipo_documento DROP NOT NULL,
    ALTER COLUMN numero_documento_cifrado DROP NOT NULL,
    ALTER COLUMN documento_hash DROP NOT NULL,
    ALTER COLUMN celular_cifrado DROP NOT NULL,
    ADD CONSTRAINT usuario_datos_jugador_check CHECK (
        rol <> 'jugador' OR (
            fecha_nacimiento_cifrada IS NOT NULL AND tipo_documento IS NOT NULL
            AND numero_documento_cifrado IS NOT NULL AND documento_hash IS NOT NULL
            AND celular_cifrado IS NOT NULL
        )
    );
