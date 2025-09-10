from rest_framework.routers import DefaultRouter
from .views import MinistryViewSet, ActivityViewSet

router = DefaultRouter()
router.register(r'ministries', MinistryViewSet, basename='ministry')
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = router.urls 