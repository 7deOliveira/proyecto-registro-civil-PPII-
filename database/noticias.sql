-- noticias
USE proyecto_rg;

CREATE TABLE Noticia (
    id_noticia INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado ENUM('borrador', 'publicada', 'archivada') DEFAULT 'borrador',
    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_baja DATETIME NULL,
    id_empleado_creador INT, 
    id_admin_autoriza INT,   
    FOREIGN KEY (id_empleado_creador) REFERENCES Empleado(id_empleado),
    FOREIGN KEY (id_admin_autoriza) REFERENCES Administrador(id_admin)
);

-- historial de noticias 
CREATE TABLE Historial_Noticias (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_noticia INT,
    accion VARCHAR(50), -- 'creación', 'modificación', 'cambio de estado'
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_responsable VARCHAR(100),
    FOREIGN KEY (id_noticia) REFERENCES Noticia(id_noticia)
);