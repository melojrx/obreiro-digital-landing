"""
Celery Configuration for Obreiro Digital
"""
import os
from celery import Celery
from django.conf import settings

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')

# Create Celery app
app = Celery('obreiro_digital')

# Configure Celery using Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load tasks from all registered Django apps
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

# Celery beat schedule (if needed)
app.conf.beat_schedule = {
    # Example: Clean expired tokens every day at midnight
    # 'clean-expired-tokens': {
    #     'task': 'apps.accounts.tasks.clean_expired_tokens',
    #     'schedule': crontab(hour=0, minute=0),
    # },
}

@app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery is working"""
    print(f'Request: {self.request!r}')