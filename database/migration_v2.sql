-- Migración v2: módulo de gestión clínica odontológica
-- Ejecutar sobre la BD existente (Railway o local)

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT NOT NULL,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    sexo             ENUM('masculino','femenino','otro'),
    telefono         VARCHAR(30),
    email            VARCHAR(150),
    direccion        TEXT,
    notas            TEXT,
    creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Condiciones preexistentes del paciente
CREATE TABLE IF NOT EXISTS condiciones (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id        INT NOT NULL,
    condicion          VARCHAR(255) NOT NULL,
    descripcion        TEXT,
    fecha_diagnostico  DATE,
    activa             BOOLEAN DEFAULT TRUE,
    creado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- Citas / agenda
CREATE TABLE IF NOT EXISTS citas (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id  INT NOT NULL,
    usuario_id   INT NOT NULL,
    fecha_hora   DATETIME NOT NULL,
    motivo       VARCHAR(255),
    estado       ENUM('pendiente','completada','cancelada') DEFAULT 'pendiente',
    notas        TEXT,
    creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE
);

-- Tratamientos odontológicos
CREATE TABLE IF NOT EXISTS tratamientos (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id  INT NOT NULL,
    cita_id      INT,
    usuario_id   INT NOT NULL,
    nombre       VARCHAR(255) NOT NULL,
    descripcion  TEXT,
    diente       VARCHAR(50),
    estado       ENUM('planificado','en_curso','completado') DEFAULT 'planificado',
    costo        DECIMAL(10,2),
    fecha_inicio DATE,
    fecha_fin    DATE,
    creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id)  ON DELETE CASCADE,
    FOREIGN KEY (cita_id)     REFERENCES citas(id)       ON DELETE SET NULL,
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)   ON DELETE CASCADE
);

-- Prescripciones / medicamentos
CREATE TABLE IF NOT EXISTS prescripciones (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id     INT NOT NULL,
    tratamiento_id  INT,
    cita_id         INT,
    usuario_id      INT NOT NULL,
    medicamento     VARCHAR(255) NOT NULL,
    dosis           VARCHAR(100),
    frecuencia      VARCHAR(100),
    duracion        VARCHAR(100),
    indicaciones    TEXT,
    fecha           DATE,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id)    REFERENCES pacientes(id)    ON DELETE CASCADE,
    FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE SET NULL,
    FOREIGN KEY (cita_id)        REFERENCES citas(id)        ON DELETE SET NULL,
    FOREIGN KEY (usuario_id)     REFERENCES usuarios(id)     ON DELETE CASCADE
);

-- Vincular análisis de IA a un paciente (opcional)
ALTER TABLE analisis ADD COLUMN IF NOT EXISTS paciente_id INT DEFAULT NULL;
-- Ejecutar solo si la clave foránea aún no existe:
-- ALTER TABLE analisis ADD CONSTRAINT fk_analisis_paciente
--     FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL;
