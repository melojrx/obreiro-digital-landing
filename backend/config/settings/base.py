"""
Django settings for Obreiro Virtual project.
Configuração modular seguindo boas práticas enterprise.
"""

import os
import environ
from pathlib import Path

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Environment variables
env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, []),
    CORS_ALLOW_ALL_ORIGINS=(bool, True),
)
# Carregar arquivo de ambiente baseado no DJANGO_SETTINGS_MODULE
env_file = '.env_prod'  # Padrão para produção
if 'dev' in os.environ.get('DJANGO_SETTINGS_MODULE', ''):
    env_file = '.env_dev'

environ.Env.read_env(os.path.join(BASE_DIR, env_file))

# =================================
# CORE DJANGO SETTINGS
# =================================

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS")

# =================================
# APPLICATION DEFINITION
# =================================

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    # DRF
    "rest_framework",
    "rest_framework.authtoken",
    # Filters and utilities
    "django_filters",
    "corsheaders",
    # Documentation
    "drf_spectacular",
    # Email templates
    "templated_mail",
]

LOCAL_APPS = [
    "apps.core",
    "apps.accounts",
    "apps.denominations",
    "apps.churches",
    "apps.branches",
    "apps.members",
    "apps.visitors",
    "apps.activities",
    "apps.prayers",
    "apps.notifications",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# =================================
# MIDDLEWARE
# =================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    # Nosso middleware multi-tenant.
    # Deve vir após a autenticação para que `request.user` exista.
    "apps.core.middleware.TenantMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

# =================================
# TEMPLATES
# =================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# =================================
# DATABASE
# =================================

DATABASES = {
    "default": env.db("DATABASE_URL")
}

# =================================
# INTERNATIONALIZATION
# =================================

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

# =================================
# STATIC & MEDIA FILES
# =================================

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# =================================
# AUTH & SECURITY
# =================================

AUTH_USER_MODEL = "accounts.CustomUser"

# Backend de autenticação personalizado
AUTHENTICATION_BACKENDS = [
    'apps.accounts.backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# =================================
# DJANGO REST FRAMEWORK
# =================================

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Rates gerais
        "anon": "60/minute",
        "user": "120/minute",
        # Escopos específicos (QR público e autenticação)
        "qr_anon": "30/minute",
        "qr_user": "120/minute",
        "auth_anon": "10/minute",
        "auth_user": "30/minute",
    },
}

# =================================
# DRF SPECTACULAR (Swagger/OpenAPI)
# =================================

SPECTACULAR_SETTINGS = {
    "TITLE": "Obreiro Virtual API",
    "DESCRIPTION": "API completa para gestão eclesiástica moderna",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/v1/",
    "TAGS": [
        {"name": "auth", "description": "Autenticação e usuários"},
        {"name": "denominations", "description": "Denominações (read-only para usuários comuns)"},
        {"name": "churches", "description": "Gestão de igrejas"},
        {"name": "branches", "description": "Filiais e QR Codes"},
        {"name": "members", "description": "Gestão de membros"},
        {"name": "visitors", "description": "Visitantes e fluxo público"},
        {"name": "activities", "description": "Atividades e eventos"},
    ],
}

# =================================
# CORS SETTINGS
# =================================

CORS_ALLOW_ALL_ORIGINS = env("CORS_ALLOW_ALL_ORIGINS")
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# =================================
# CELERY CONFIGURATION
# =================================

CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/2")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/3")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# =================================
# NOTIFICATIONS CONFIGURATION
# =================================

# SSE (Server-Sent Events) para notificações em tempo real
# ⚠️ ATENÇÃO: SSE em produção requer servidor ASGI (Uvicorn/Daphne) ou Gunicorn+Gevent
# Atualmente desabilitado em produção para evitar bloqueio de workers
# Ver: docs/SSE_PRODUCTION_REQUIREMENTS.md
ENABLE_SSE = env.bool("ENABLE_SSE", default=False)  # Padrão: False (usar polling)
SSE_CHECK_INTERVAL = env.int("SSE_CHECK_INTERVAL", default=3)  # Segundos entre verificações
SSE_HEARTBEAT_INTERVAL = env.int("SSE_HEARTBEAT_INTERVAL", default=30)  # Heartbeat
SSE_MAX_CONNECTIONS_PER_USER = env.int("SSE_MAX_CONNECTIONS_PER_USER", default=1)

# Polling como estratégia principal/fallback
NOTIFICATION_POLLING_INTERVAL = env.int("NOTIFICATION_POLLING_INTERVAL", default=60000)  # ms

# =================================
# CACHE CONFIGURATION
# =================================

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://localhost:6379/0"),
    }
}

# =================================
# LOGGING
# =================================

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# =================================
# DEFAULT FIELD TYPE
# =================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# =================================
# FRONTEND CONFIGURATION
# =================================

FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:5173')

# =================================
# EMAIL CONFIGURATION
# =================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)
SERVER_EMAIL = EMAIL_HOST_USER

# Configuração para django-templated-mail
TEMPLATED_EMAIL_BACKEND = 'templated_mail.backends.TemplateEmailBackend'
TEMPLATED_EMAIL_FILE_EXTENSION = 'html'
