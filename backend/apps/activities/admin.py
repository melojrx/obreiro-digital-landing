from django.contrib import admin
from .models import Ministry, Activity, ActivityParticipant, ActivityResource, ActivityResourceRequest


admin.site.register(Ministry)
admin.site.register(Activity)
admin.site.register(ActivityParticipant)
admin.site.register(ActivityResource)
admin.site.register(ActivityResourceRequest)
