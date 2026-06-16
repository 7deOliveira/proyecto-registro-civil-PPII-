from django.shortcuts import render
from .models import Noticia


# Página principal
def home(request):

    noticias = Noticia.objects.filter(
        estado='publicada'
    ).order_by('-fecha')[:3]

    return render(
        request,
        'noticias/index.html',
        {'noticias': noticias}
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