"""
Configurações específicas para desenvolvimento - Docker
"""

from .base import *

# =================================
# DESENVOLVIMENTO ESPECÍFICO
# =================================

DEBUG = True

# Hosts permitidos em desenvolvimento
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'backend',  # Container name
]

# =================================
# NOTIFICATIONS - SSE habilitado em dev
# =================================

ENABLE_SSE = True  # SSE funciona em dev com runserver

# =================================
# DATABASE - PostgreSQL para consistência
# =================================

DATABASES = {
    'default': env.db('DATABASE_URL')
}

# =================================
# CORS - Liberado para desenvolvimento
# =================================

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

CORS_ALLOW_CREDENTIALS = True

# =================================
# EMAIL - Usa configuração do .env_dev
# =================================

# Permite configurar via .env_dev (padrão: console para logs, smtp para envio real)
EMAIL_BACKEND = env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)

# =================================
# CACHE - Redis para consistência com produção
# =================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://redis:6379/0'),
    }
}

# =================================
# CELERY - Desenvolvimento
# =================================

CELERY_TASK_ALWAYS_EAGER = env.bool('CELERY_TASK_ALWAYS_EAGER', default=False)
CELERY_TASK_EAGER_PROPAGATES = True

# =================================
# LOGGING - Mais verboso para desenvolvimento
# =================================

LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': env('DJANGO_LOG_LEVEL', default='INFO'),
    'propagate': False,
}

LOGGING['loggers']['apps'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}

# =================================
# DRF - Mais permissivo em desenvolvimento
# =================================

REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',  # UI navegável
]

# =================================
# SPECTACULAR - Documentação mais detalhada
# =================================

SPECTACULAR_SETTINGS.update({
    'SERVE_INCLUDE_SCHEMA': True,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
    }
}) 