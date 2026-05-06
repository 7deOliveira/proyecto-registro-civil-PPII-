-- roles y oficinas
USE proyecto_rg;

CREATE TABLE Administrador (
    id_admin INT PRIMARY KEY AUTO_INCREMENT,
    correo VARCHAR(100) UNIQUE,
    nivel_privilegio INT DEFAULT 1,
    FOREIGN KEY (correo) REFERENCES Personal(correo)
);

CREATE TABLE Empleado (
    id_empleado INT PRIMARY KEY AUTO_INCREMENT,
    area VARCHAR(100),
    correo VARCHAR(100) UNIQUE,
    id_admin_gestor INT, 
    FOREIGN KEY (correo) REFERENCES Personal(correo),
    FOREIGN KEY (id_admin_gestor) REFERENCES Administrador(id_admin)
);

CREATE TABLE Oficina (
    id_oficina INT PRIMARY KEY AUTO_INCREMENT,
    ubicacion VARCHAR(255),
    estado_oficina VARCHAR(50),
    id_admin_gestor INT, 
    FOREIGN KEY (id_admin_gestor) REFERENCES Administrador(id_admin)
);