from django.db import models
from django.contrib.auth.models import User


class Noticia(models.Model):

    creado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="noticias_creadas"
    )

    ESTADOS = [
        ('borrador', 'Borrador'),
        ('publicada', 'Publicada'),
        ('archivada', 'Archivada'),
    ]

    titulo = models.CharField(max_length=200)

    fecha = models.DateField()

    tag = models.CharField(max_length=100)

    cuerpo = models.TextField()

    icono = models.CharField(
        max_length=100,
        default='bi-newspaper'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='borrador'
    )

    fecha_alta = models.DateTimeField(
        auto_now_add=True
    )

    fecha_baja = models.DateTimeField(
        null=True,
        blank=True
    )

    def save(self, *args, **kwargs):

        es_nueva = self.pk is None
        estado_anterior = None

        if not es_nueva:
            noticia_vieja = Noticia.objects.get(pk=self.pk)
            estado_anterior = noticia_vieja.estado

        super().save(*args, **kwargs)

        if es_nueva:

            HistorialNoticias.objects.create(
                noticia=self,
                accion='creación',
                usuario_responsable='admin'
            )

        else:

            HistorialNoticias.objects.create(
                noticia=self,
                accion='modificación',
                usuario_responsable='admin'
            )

            if estado_anterior != self.estado:

                HistorialNoticias.objects.create(
                    noticia=self,
                    accion='cambio de estado',
                    usuario_responsable='admin'
                )

    def __str__(self):
        return self.titulo


class HistorialNoticias(models.Model):

    noticia = models.ForeignKey(
        Noticia,
        on_delete=models.CASCADE
    )

    accion = models.CharField(max_length=50)

    fecha_movimiento = models.DateTimeField(
        auto_now_add=True
    )

    usuario_responsable = models.CharField(
        max_length=100
    )

    def __str__(self):
        return self.accion


class Tramite(models.Model):

    nombre_tramite = models.CharField(
        max_length=150
    )

    descripcion = models.TextField(
        blank=True,
        null=True
    )

    def __str__(self):
        return self.nombre_tramite


class Oficina(models.Model):

    nombre = models.CharField(
        max_length=150
    )

    ubicacion = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    departamento = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    horario_atencion = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    latitud = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        blank=True,
        null=True
    )

    longitud = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        blank=True,
        null=True
    )

    estado_oficina = models.CharField(
        max_length=50,
        default='activa'
    )

    tramites = models.ManyToManyField(
        Tramite,
        blank=True
    )

    def __str__(self):
        return self.nombre

class Ciudadano(models.Model):

    dni = models.CharField(
        max_length=20,
        unique=True
    )

    nombre = models.CharField(
        max_length=100
    )

    apellido = models.CharField(
        max_length=100
    )

    fecha_nacimiento = models.DateField()

    email = models.EmailField(
        blank=True,
        null=True
    )

    telefono = models.CharField(
        max_length=30,
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.apellido}, {self.nombre} - DNI {self.dni}"

class Turno(models.Model):

    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('asistio', 'Asistió'),
        ('no_asistio', 'No asistió'),
        ('reprogramado', 'Reprogramado'),
    ]

    fecha = models.DateField()

    hora = models.TimeField()

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='pendiente'
    )

    email_notificacion = models.EmailField(
        blank=True,
        null=True
    )

    ciudadano = models.ForeignKey(
        Ciudadano,
        on_delete=models.CASCADE
    )

    oficina = models.ForeignKey(
        Oficina,
        on_delete=models.CASCADE
    )

    tramite = models.ForeignKey(
        Tramite,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.ciudadano} - {self.fecha} {self.hora}"

class HistorialTurno(models.Model):

    turno = models.ForeignKey(
        Turno,
        on_delete=models.CASCADE
    )

    estado_anterior = models.CharField(
        max_length=50
    )

    estado_nuevo = models.CharField(
        max_length=50
    )

    fecha_cambio = models.DateTimeField(
        auto_now_add=True
    )

    motivo = models.TextField(
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.turno} - {self.estado_nuevo}"