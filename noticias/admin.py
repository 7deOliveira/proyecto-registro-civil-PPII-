from django.contrib import admin
from .models import (
    Noticia,
    HistorialNoticias,
    Oficina,
    Tramite,
    Ciudadano, 
    Turno,
    HistorialTurno
)


class NoticiaAdmin(admin.ModelAdmin):

    list_display = (
        'titulo',
        'estado',
        'creado_por',
        'fecha'
    )

    list_filter = (
        'estado',
        'fecha'
    )

    search_fields = (
        'titulo',
        'tag'
    )


class OficinaAdmin(admin.ModelAdmin):

    list_display = (
        'nombre',
        'departamento',
        'horario_atencion',
        'estado_oficina'
    )

    search_fields = (
        'nombre',
        'departamento'
    )

    list_filter = (
        'estado_oficina',
        'departamento'
    )

    filter_horizontal = (
        'tramites',
    )


class TramiteAdmin(admin.ModelAdmin):

    list_display = (
        'nombre_tramite',
    )

    search_fields = (
        'nombre_tramite',
    )
class CiudadanoAdmin(admin.ModelAdmin):

    list_display = (
        'dni',
        'apellido',
        'nombre',
        'email'
    )

    search_fields = (
        'dni',
        'apellido',
        'nombre'
    )

class TurnoAdmin(admin.ModelAdmin):

    list_display = (
        'ciudadano',
        'tramite',
        'oficina',
        'fecha',
        'hora',
        'estado'
    )

    list_filter = (
        'estado',
        'fecha'
    )

    search_fields = (
        'ciudadano__apellido',
        'ciudadano__nombre',
        'ciudadano__dni'
    )

class HistorialTurnoAdmin(admin.ModelAdmin):

    list_display = (
        'turno',
        'estado_anterior',
        'estado_nuevo',
        'fecha_cambio'
    )

    list_filter = (
        'estado_nuevo',
    )

admin.site.register(Noticia, NoticiaAdmin)
admin.site.register(HistorialNoticias)
admin.site.register(Oficina, OficinaAdmin)
admin.site.register(Tramite, TramiteAdmin)
admin.site.register(Ciudadano, CiudadanoAdmin) 
admin.site.register(Turno, TurnoAdmin)
admin.site.register(HistorialTurno, HistorialTurnoAdmin) 
