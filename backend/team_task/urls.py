from django.urls import path, include
from rest_framework.routers import DefaultRouter
from team_task.views import TeamTaskViewSet

router = DefaultRouter()

router.register('team_task', TeamTaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
]