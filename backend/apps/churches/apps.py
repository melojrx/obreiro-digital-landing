from django.apps import AppConfig


class ChurchesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.churches"
    
    def ready(self):
        """Importa signals quando o app está pronto"""
        import apps.churches.signals  # noqa
