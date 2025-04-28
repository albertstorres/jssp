from django.urls import path, include
from rest_framework.routers import DefaultRouter
from workers.views import WorkerViewSet

router = DefaultRouter()

router.register('workers', WorkerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]