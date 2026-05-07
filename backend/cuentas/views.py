from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

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