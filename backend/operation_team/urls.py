from django.urls import path, include
from rest_framework.routers import DefaultRouter
from operation_team.views import OperationTeamViewSet

router = DefaultRouter()
router.register(r'operation-teams', OperationTeamViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
