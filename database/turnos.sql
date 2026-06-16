
-- turnos
USE proyecto_rg;

CREATE TABLE Turno (
    id_turno INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    -- estado mejorado
    estado ENUM('activo', 'cancelado', 'reprogramado', 'completado') DEFAULT 'activo',
    tipo VARCHAR(100),
    email_notificacion VARCHAR(100), -- Campo email para el turno
    asistio BOOLEAN DEFAULT FALSE,
    dni_ciudadano VARCHAR(20), 
    id_oficina INT,           
    id_empleado_atiende INT,   
    FOREIGN KEY (dni_ciudadano) REFERENCES Ciudadano(dni),
    FOREIGN KEY (id_oficina) REFERENCES Oficina(id_oficina),
    FOREIGN KEY (id_empleado_atiende) REFERENCES Empleado(id_empleado)
);

-- historial de cambios en turnos
CREATE TABLE Historial_Turnos (
    id_historial_turno INT PRIMARY KEY AUTO_INCREMENT,
    id_turno INT,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    FOREIGN KEY (id_turno) REFERENCES Turno(id_turno)
);