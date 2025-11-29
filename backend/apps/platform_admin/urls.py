from django.urls import path

from .views import (
    ActivitySummaryView,
    ActivityLoginsView,
    GeographyMapDataView,
    NewMembersThisMonthView,
    PlanDistributionView,
    PlatformOverviewView,
    SubscriptionAlertsView,
    TopChurchesView,
    TopChurchesVisitorsView,
)


urlpatterns = [
    path("overview/", PlatformOverviewView.as_view(), name="platform-overview"),
    path(
        "distributions/plans/",
        PlanDistributionView.as_view(),
        name="platform-plan-distribution",
    ),
    path(
        "rankings/top-churches/",
        TopChurchesView.as_view(),
        name="platform-top-churches",
    ),
    path(
        "rankings/top-churches-visitors/",
        TopChurchesVisitorsView.as_view(),
        name="platform-top-churches-visitors",
    ),
    path(
        "activity/summary/",
        ActivitySummaryView.as_view(),
        name="platform-activity-summary",
    ),
    path(
        "activity/logins/",
        ActivityLoginsView.as_view(),
        name="platform-activity-logins",
    ),
    path(
        "members/new-this-month/",
        NewMembersThisMonthView.as_view(),
        name="platform-new-members-month",
    ),
    path(
        "subscriptions/expiring/",
        SubscriptionAlertsView.as_view(),
        name="platform-subscription-alerts",
    ),
    path(
        "geography/map-data/",
        GeographyMapDataView.as_view(),
        name="platform-geo-map-data",
    ),
]
