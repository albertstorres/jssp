from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamTaskViewSet

router = DefaultRouter()
router.register(r'team_task', TeamTaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
]