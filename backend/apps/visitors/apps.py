from django.apps import AppConfig


class VisitorsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.visitors"
    verbose_name = "Visitantes"
    
    def ready(self):
        """Importar signals quando a app for carregada"""
        import apps.visitors.signals
