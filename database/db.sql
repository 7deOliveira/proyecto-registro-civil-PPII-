use login;
create table personal(
	correo VARCHAR(100) PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE, -- para "dar de baja" sin borrar datos
    ultimo_acceso DATETIME
);

CREATE TABLE Administrador (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    correo_personal VARCHAR(100) UNIQUE, 
    nivel_privilegio INT DEFAULT 1,
    FOREIGN KEY (correo_personal) REFERENCES Personal(correo)
);

--  registro Personal
INSERT INTO Personal (correo, usuario, contrasena, nombre, apellido) 
VALUES ('admin@registro.gob.ar', 'admin_central', '12345', 'Juan', 'Pérez');

-- lo vinculacomo Administrador
INSERT INTO Administrador (correo_personal) 
VALUES ('admin@registro.gob.ar');

SELECT p.nombre, p.usuario, a.id_admin
FROM Personal p
JOIN Administrador a ON p.correo = a.correo_personal
WHERE p.usuario = 'admin_central' AND p.contrasena = '12345';
