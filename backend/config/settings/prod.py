"""
Configurações específicas para produção
"""

from .base import *

# =================================
# PRODUÇÃO ESPECÍFICO
# =================================

DEBUG = False

# Hosts permitidos - MUST BE CONFIGURED FOR PRODUCTION
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['obreirovirtual.com', 'www.obreirovirtual.com'])

# =================================
# NOTIFICATIONS - SSE desabilitado em produção
# =================================

# ⚠️ SSE DESABILITADO EM PRODUÇÃO
# Motivo: Requer Gunicorn+Gevent ou servidor ASGI
# time.sleep() bloqueia workers WSGI, causando travamento com múltiplos usuários
# 
# Para habilitar SSE em produção:
# 1. Migrar para Gunicorn com worker gevent: gunicorn -k gevent
# 2. OU migrar para ASGI (Uvicorn/Daphne + Django Channels)
# 3. Implementar cache Redis para contagens (evitar query N+1)
# 4. Adicionar limite de conexões por usuário
# 5. Testar com 100+ usuários simultâneos
#
# Enquanto isso, polling é estável e confiável (latência 60s é aceitável)
ENABLE_SSE = False  # Polling ativo como estratégia principal

# =================================
# DATABASE - PostgreSQL
# =================================

DATABASES = {
    'default': env.db('DATABASE_URL')
}

# =================================
# SECURITY SETTINGS
# =================================

# HTTPS/SSL
USE_TLS = env.bool('USE_HTTPS', default=True)
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Session security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600  # 1 hour

# CSRF protection
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

# =================================
# CORS - Restrito para produção
# =================================

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'https://obreirovirtual.com',
    'https://www.obreirovirtual.com'
])

CORS_ALLOW_CREDENTIALS = True

# =================================
# EMAIL - SMTP para produção
# =================================

# Email backend - permite trocar via .env_prod (console para debug, smtp para produção)
EMAIL_BACKEND = env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='suporteobreirovirtual@gmail.com')

# =================================
# CACHE - Redis para produção
# =================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://redis:6379/0'),
        'OPTIONS': {
            'db': 0,
        },
        'KEY_PREFIX': 'obreiro_prod',
        'TIMEOUT': 300,
    }
}

# =================================
# CELERY - Produção
# =================================

CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False

# =================================
# LOGGING - Produção
# =================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': env('DJANGO_LOG_LEVEL', default='INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# =================================
# STATIC & MEDIA - Produção
# =================================

# Static files (CSS, JavaScript, Images)
STATIC_ROOT = '/app/staticfiles/'
MEDIA_ROOT = '/app/media/'

# =================================
# SPECTACULAR - Produção
# =================================

SPECTACULAR_SETTINGS.update({
    'SERVE_INCLUDE_SCHEMA': False,  # Não incluir schema em produção
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': False,
        'persistAuthorization': False,
    }
})

# =================================
# SENTRY - Monitoramento de erros (opcional)
# =================================

# SENTRY_DSN = env('SENTRY_DSN', default='')
# if SENTRY_DSN:
#     import sentry_sdk
#     from sentry_sdk.integrations.django import DjangoIntegration
#     from sentry_sdk.integrations.celery import CeleryIntegration
#     
#     sentry_sdk.init(
#         dsn=SENTRY_DSN,
#         integrations=[DjangoIntegration(), CeleryIntegration()],
#         traces_sample_rate=0.1,
#         send_default_pii=True
#     )

# =================================
# AWS S3 - Arquivos estáticos (opcional)
# =================================

# AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID', default='')
# AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY', default='')
# AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME', default='')
# 
# if AWS_ACCESS_KEY_ID:
#     AWS_S3_REGION_NAME = 'us-east-1'
#     AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
#     AWS_DEFAULT_ACL = 'public-read'
#     
#     # Static files
#     STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
#     STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
#     
#     # Media files
#     DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
#     MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'