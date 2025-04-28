from django.urls import path, include
from rest_framework.routers import DefaultRouter
from operation_tasks.views import OperationTasksViewSet

router = DefaultRouter()

router.register('operation/tasks', OperationTasksViewSet)

urlpatterns = [
    path('', include(router.urls)),
]