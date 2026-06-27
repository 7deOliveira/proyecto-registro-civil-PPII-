from django.shortcuts import render
from .models import Noticia
import json


# Página principal
def home(request):

    noticias_qs = Noticia.objects.filter(
        estado='publicada'
    ).order_by('-fecha')[:3]

    noticias_for_js = []

    for n in noticias_qs:
        try:
            imagen_url = n.imagen.url
        except Exception:
            imagen_url = ''

        noticias_for_js.append({
            'id': n.pk,
            'titulo': n.titulo,
            'fecha': n.fecha.isoformat() if n.fecha else '',
            'tag': n.tag,
            'cuerpo': n.cuerpo,
            'icono': n.icono,
            'imagen': imagen_url,
        })

    noticias_json = json.dumps(noticias_for_js, ensure_ascii=False)

    return render(
        request,
        'noticias/index.html',
        {'noticias': noticias_qs, 'noticias_json': noticias_json}
    )


# Trámites
def tramites(request):
    return render(request, 'tramites.html')


# Sedes
def sedes(request):
    return render(request, 'sedes.html')


# DNI 5-8 años
def dni_5_8(request):
    return render(request, 'dni_5_8.html')


# DNI 14 años
def dni_14(request):
    return render(request, 'dni_14.html')


# Cambio de domicilio
def dni_domicilio(request):
    return render(request, 'dni_domicilio.html')


# Nuevo ejemplar DNI
def dni_nuevo(request):
    return render(request, 'dni_nuevo.html')
