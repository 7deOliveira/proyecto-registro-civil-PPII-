-- personal y ciudadano
USE proyecto_rg;

CREATE TABLE Personal (
    correo VARCHAR(100) PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso DATETIME
);

CREATE TABLE Ciudadano (
    dni VARCHAR(20) PRIMARY KEY,
    nombre_ciudadano VARCHAR(100) NOT NULL,
    apellido_ciudadano VARCHAR(100) NOT NULL,
    correo VARCHAR(100)
);