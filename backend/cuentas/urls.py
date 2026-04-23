from django.urls import path
from .views import login_view, admin_panel, logout_view

urlpatterns = [
    path('login/', login_view, name='login'),
    path('admin-panel/', admin_panel, name='admin_panel'),
    path('logout/', logout_view, name='logout'),
]