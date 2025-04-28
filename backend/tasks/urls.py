from django.urls import path, include
from tasks.views import TaskViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

router.register('tasks', TaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
]