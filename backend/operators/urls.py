from django.urls import path, include
from rest_framework.routers import DefaultRouter
from operators.views import OperatorViewSet

router = DefaultRouter()

router.register('operators', OperatorViewSet)

urlpatterns = [
    path('', include(router.urls))
]