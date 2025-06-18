from django.urls import path, include
from rest_framework.routers import DefaultRouter
from equipment.views import EquipmentViewSet, DownTimePeriodViewSet

router = DefaultRouter()

router.register('equipments', EquipmentViewSet)
router.register('downtime', DownTimePeriodViewSet)

urlpatterns = [
    path('', include(router.urls)),
]