from rest_framework.throttling import SimpleRateThrottle


class QRCodeAnonRateThrottle(SimpleRateThrottle):
    """Throttle para endpoints públicos de QR Code (anônimos)."""
    scope = 'qr_anon'

    def get_cache_key(self, request, view):
        # Usa IP do cliente para anon
        return self.get_ident(request)


class QRCodeUserRateThrottle(SimpleRateThrottle):
    """Throttle para endpoints de QR Code quando autenticado (fallback)."""
    scope = 'qr_user'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f"user-{request.user.pk}"
        else:
            ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class AuthAnonRateThrottle(SimpleRateThrottle):
    """Throttle para endpoints públicos de autenticação (login)."""
    scope = 'auth_anon'

    def get_cache_key(self, request, view):
        return self.get_ident(request)


class AuthUserRateThrottle(SimpleRateThrottle):
    """Throttle para endpoints de autenticação quando autenticado (baixa prioridade)."""
    scope = 'auth_user'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f"user-{request.user.pk}"
        else:
            ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}

