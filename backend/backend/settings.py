"""
Configuración de Django para el proyecto Registro Civil – Santiago del Estero.

Variables de entorno requeridas (archivo .env en la raíz del proyecto):
    SECRET_KEY   – Clave secreta de Django (nunca compartir ni subir a git)
    DEBUG        – True en desarrollo, False en producción
    ALLOWED_HOSTS – Hosts permitidos, separados por coma
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ── Rutas base ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# Carga variables desde el archivo .env (solo en desarrollo)
load_dotenv(BASE_DIR / '.env')


# ── Seguridad ────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ['SECRET_KEY']  # Obligatorio – falla si no está definido

DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Orígenes de confianza para CSRF (túnel VS Code, producción, etc.)
CSRF_TRUSTED_ORIGINS = [
    h.strip() for h in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if h.strip()
]

# ── Headers de seguridad HTTP ────────────────────────────────────────────────
# Activos siempre; algunos solo tienen efecto con HTTPS en producción
SECURE_CONTENT_TYPE_NOSNIFF = True   # Evita MIME-sniffing
SECURE_BROWSER_XSS_FILTER   = True   # Filtro XSS del navegador (legacy, no daña)
X_FRAME_OPTIONS              = 'DENY' # Previene clickjacking

# En producción (cuando DEBUG=False) activar estas líneas:
# SECURE_SSL_REDIRECT          = True
# SECURE_HSTS_SECONDS          = 31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SESSION_COOKIE_SECURE        = True
# CSRF_COOKIE_SECURE           = True


# ── Aplicaciones instaladas ──────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Seguridad: bloqueo de intentos de login por fuerza bruta
    'axes',
    # Apps del proyecto
    'cuentas',
    'usuarios',
    'sedes',
    'tramites_app',
    'turnos',
    'noticias',
]


# ── Middleware ───────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',   # Archivos estáticos
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'axes.middleware.AxesMiddleware',               # Rate limiting – debe ir después de auth
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ── URLs y WSGI ──────────────────────────────────────────────────────────────
ROOT_URLCONF       = 'backend.urls'
WSGI_APPLICATION   = 'backend.wsgi.application'


# ── Templates ────────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# ── Base de datos ────────────────────────────────────────────────────────────
# SQLite para desarrollo. En producción usar PostgreSQL vía DATABASE_URL.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Backend de autenticación compatible con django-axes
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]


# ── Validación de contraseñas ────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ── Internacionalización ─────────────────────────────────────────────────────
LANGUAGE_CODE = 'es-ar'
TIME_ZONE     = 'America/Argentina/Buenos_Aires'
USE_I18N      = True
USE_TZ        = True


# ── Archivos estáticos ───────────────────────────────────────────────────────
STATIC_URL       = '/static/'
STATIC_ROOT      = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}


# ── Archivos de media (imágenes subidas por usuarios) ───────────────────────
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# ── Sesiones ─────────────────────────────────────────────────────────────────
SESSION_EXPIRE_AT_BROWSER_CLOSE = True   # Sesión termina al cerrar el navegador
SESSION_COOKIE_AGE              = 60 * 60 * 8  # Máximo 8 horas
SESSION_SAVE_EVERY_REQUEST      = True   # Reinicia el contador en cada request


# ── Autenticación ────────────────────────────────────────────────────────────
LOGIN_URL             = '/login/'
LOGIN_REDIRECT_URL    = '/admin-panel/'
LOGOUT_REDIRECT_URL   = '/login/'


# ── django-axes: protección contra fuerza bruta ──────────────────────────────
AXES_FAILURE_LIMIT        = 5     # Bloquea tras 5 intentos fallidos
AXES_COOLOFF_TIME         = 1     # Tiempo de bloqueo: 1 hora
AXES_LOCKOUT_CALLABLE     = None  # Usa la respuesta por defecto (403)
AXES_RESET_ON_SUCCESS     = True  # Resetea el contador al loguearse con éxito
AXES_ENABLE_ADMIN         = True  # Muestra los intentos en el panel admin


# ── Misc ──────────────────────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
