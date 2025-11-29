"""
Serializers de saída para endpoints do dashboard do Super Admin.
"""

from rest_framework import serializers


class CountWithNewSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    new_this_month = serializers.IntegerField(required=False)
    active_30d = serializers.IntegerField(required=False)


class SimpleCountSerializer(serializers.Serializer):
    total = serializers.IntegerField()


class PlanDistributionItemSerializer(serializers.Serializer):
    plan = serializers.CharField()
    label = serializers.CharField(allow_null=True, required=False)
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class PlanDistributionSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    plans = PlanDistributionItemSerializer(many=True)


class SubscriptionAlertItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    short_name = serializers.CharField(allow_null=True, required=False)
    subscription_plan = serializers.CharField()
    subscription_end_date = serializers.DateTimeField()
    denomination = serializers.CharField(allow_null=True, required=False)


class SubscriptionAlertSerializer(serializers.Serializer):
    expiring_count = serializers.IntegerField()
    expired_count = serializers.IntegerField()
    expiring = SubscriptionAlertItemSerializer(many=True)
    days_window = serializers.IntegerField()


class ActivitySummarySerializer(serializers.Serializer):
    logins_24h = serializers.IntegerField()
    logins_7d = serializers.IntegerField()
    new_members_month = serializers.IntegerField()
    new_users_month = serializers.IntegerField()


class ActivityLoginsSerializer(serializers.Serializer):
    logins_24h = serializers.IntegerField()
    logins_7d = serializers.IntegerField()


class NewMembersSerializer(serializers.Serializer):
    new_members_month = serializers.IntegerField()


class TopChurchSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    short_name = serializers.CharField(allow_null=True, required=False)
    city = serializers.CharField()
    state = serializers.CharField()
    subscription_plan = serializers.CharField()
    members_count = serializers.IntegerField()
    new_members_month = serializers.IntegerField()


class TopChurchVisitorsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    short_name = serializers.CharField(allow_null=True, required=False)
    city = serializers.CharField()
    state = serializers.CharField()
    subscription_plan = serializers.CharField()
    visitors_count = serializers.IntegerField()


class PlatformOverviewSerializer(serializers.Serializer):
    users = CountWithNewSerializer()
    denominations = SimpleCountSerializer()
    churches = CountWithNewSerializer()
    branches = SimpleCountSerializer()
    members = CountWithNewSerializer()
    visitors = CountWithNewSerializer()
    plans = PlanDistributionSerializer()
    subscriptions = SubscriptionAlertSerializer()
    activity = ActivitySummarySerializer()
    data_quality = serializers.DictField()


class GeoStateSerializer(serializers.Serializer):
    code = serializers.CharField()
    churches_count = serializers.IntegerField()
    total_users = serializers.IntegerField()
    active_members = serializers.IntegerField()
