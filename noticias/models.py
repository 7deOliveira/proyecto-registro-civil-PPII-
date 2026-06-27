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

    # Nueva imagen para la noticia (opcional)
    imagen = models.ImageField(
        upload_to='noticias/',
        null=True,
        blank=True
    )

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

175| class Ciudadano(models.Model):

177|     dni = models.CharField(
178|         max_length=20,
179|         unique=True
180|     )

181| 
