"""
Configurações de desenvolvimento para Obreiro Virtual
"""

from .base import *

# =================================
# DEVELOPMENT OVERRIDES
# =================================

DEBUG = True

# Banco SQLite para desenvolvimento (opcional)
# Se quiser usar PostgreSQL, mantenha o DATABASE_URL no .env

# Email backend para desenvolvimento
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Debug toolbar (opcional)
# if DEBUG:
#     INSTALLED_APPS += ["debug_toolbar"]
#     MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
#     INTERNAL_IPS = ["127.0.0.1"]

# Logging mais verboso em desenvolvimento
LOGGING["loggers"]["django.db.backends"] = {
    "handlers": ["console"],
    "level": "DEBUG",
    "propagate": False,
}

# CORS mais permissivo em desenvolvimento
CORS_ALLOW_ALL_ORIGINS = True

# Cache dummy para desenvolvimento (opcional)
# CACHES = {
#     "default": {
#         "BACKEND": "django.core.cache.backends.dummy.DummyCache",
#     }
# } 