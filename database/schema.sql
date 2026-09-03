-- Ejecutar dentro de la base de datos ya existente (ferrocarril en Railway, o cindy_dent en local)
-- Si usas Railway, conéctate con: mysql -h HOST -P PORT -u raiz -p ferrocarril < schema.sql

CREATE TABLE IF NOT EXISTS usuarios (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100)  NOT NULL,
    email        VARCHAR(150)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analisis (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id         INT          NOT NULL,
    nombre_imagen      VARCHAR(255),
    total_detecciones  INT          DEFAULT 0,
    detecciones        JSON,
    resultado_base64   LONGTEXT,
    creado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
