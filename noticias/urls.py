
from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),

   # path("noticias/", views.noticias, name="noticias"),

    path("tramites/", views.tramites, name="tramites"),
    path("sedes/", views.sedes, name="sedes"),

    path("dni/5-8/", views.dni_5_8, name="dni_5_8"),
    path("dni/14/", views.dni_14, name="dni_14"),
    path("dni/domicilio/", views.dni_domicilio, name="dni_domicilio"),
    path("dni/nuevo/", views.dni_nuevo, name="dni_nuevo"),
]
