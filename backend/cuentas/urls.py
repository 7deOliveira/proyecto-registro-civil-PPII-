from django.urls import path
from .views import inicio, login_view, admin_panel, logout_view, usuario_actual

urlpatterns = [
    path('login/', login_view, name='login'),
    path('admin-panel/', admin_panel, name='admin_panel'),
    path('logout/', logout_view, name='logout'),
    path('', inicio, name='inicio'),
    path('api/usuario-actual/', usuario_actual, name='usuario_actual'),
]