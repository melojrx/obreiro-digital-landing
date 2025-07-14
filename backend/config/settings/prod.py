"""
Configurações específicas para produção
"""

from .base import *

# =================================
# PRODUÇÃO ESPECÍFICO
# =================================

DEBUG = False

# Hosts permitidos - MUST BE CONFIGURED FOR PRODUCTION
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['obreiro.digital', 'www.obreiro.digital'])

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
    'https://obreiro.digital',
    'https://www.obreiro.digital'
])

CORS_ALLOW_CREDENTIALS = True

# =================================
# EMAIL - SMTP para produção
# =================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

# =================================
# CACHE - Redis para produção
# =================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://redis:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
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
        'file': {
            'class': 'logging.FileHandler',
            'filename': '/var/log/obreiro/django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': env('DJANGO_LOG_LEVEL', default='INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# =================================
# STATIC & MEDIA - Produção
# =================================

# Static files (CSS, JavaScript, Images)
STATIC_ROOT = '/var/www/html/static/'
MEDIA_ROOT = '/var/www/html/media/'

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