from django.urls import path, include
from rest_framework.routers import DefaultRouter
from operations.views import OperationViewSet

router = DefaultRouter()

router.register('operations', OperationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]