from django.contrib import admin
from .models import Member, MembershipStatusLog, MemberTransferLog, MembershipStatus

admin.site.register(Member)
admin.site.register(MembershipStatusLog)
admin.site.register(MemberTransferLog)
admin.site.register(MembershipStatus)
