from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from tramites_app.views import lista_tramites as tramites
from django.template.loader import get_template
from django.template import TemplateDoesNotExist
from tramites_app.models import Tramite as TramiteModel

def login_view(request):
    if request.user.is_authenticated:
        return redirect('admin_panel')

    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']

        user = authenticate(request, username=username, password=password)

        if user is not None and user.is_active and user.is_staff:
            login(request, user)
            return redirect('admin_panel')
        elif user is not None and not user.is_staff:
            return render(request, 'login.html', {'error': 'No tenés permisos para acceder al panel.'})
        elif user is not None and not user.is_active:
            return render(request, 'login.html', {'error': 'Tu usuario está desactivado.'})
        else:
            return render(request, 'login.html', {'error': 'Usuario o contraseña incorrectos.'})

    return render(request, 'login.html')


@login_required
def admin_panel(request):
    try:
        perfil = request.user.perfil
        rol = perfil.rol
    except:
        rol = 'super_admin' if request.user.is_superuser else 'operador'

    return render(request, 'admin.html', {
        'es_superadmin': request.user.is_superuser or rol == 'super_admin',
        'usuario': request.user,
        'rol': rol,
    })


def logout_view(request):
    logout(request)
    return redirect('login')


def inicio(request):
    return render(request, 'index-1.html')


@login_required
def usuario_actual(request):
    return JsonResponse({
        'username': request.user.username,
        'nombre':   request.user.get_full_name() or request.user.username,
        'email':    request.user.email,
        'rol':      'super_admin' if request.user.is_superuser else 'operador',
    })

def identificacion(request):
    return render(request, 'identificacion.html')

def tramites(request):
    return render(request, 'tramites.html')

def tramite_detalle(request, slug):
    try:
        get_template(f'tramites/{slug}.html')
        return render(request, f'tramites/{slug}.html')
    except TemplateDoesNotExist:
        # Si no existe, usá el template genérico con datos del modelo
        tramite = get_object_or_404(TramiteModel, slug=slug, estado='publicado')
        return render(request, 'tramites/detalle_generico.html', {'tramite': tramite})

def sedes(request):
    return render(request, 'sedes.html')

def nacimiento(request):
    return render(request, 'nacimiento.html')

def defuncion(request):
    return render(request, 'defuncion.html')

def matrimonio(request):
    return render(request, 'matrimonio.html')

from sedes.models import Sede

def sedes(request):
    sedes_activas = Sede.objects.filter(activo=True).values(
        'id', 'nombre', 'direccion', 'departamento', 'provincia', 'horario', 'latitud', 'longitud'
    )
    import json
    from decimal import Decimal

    sedes_list = []
    for s in sedes_activas:
        sedes_list.append({
            'id':           s['id'],
            'nombre':       s['nombre'],
            'direccion':    s['direccion'],
            'departamento': s['departamento'],
            'provincia':    s['provincia'],
            'horario':      s['horario'],
            'lat':          float(s['latitud'])  if s['latitud']  else None,
            'lng':          float(s['longitud']) if s['longitud'] else None,
        })

    return render(request, 'sedes.html', {
        'sedes_json': json.dumps(sedes_list)
    })