from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets

from equipment.serializers import EquipmentSerializer
from equipment.serializers import DowntimePeriodSerializer

from equipment.models import Equipment
from equipment.models import DowntimePeriod

from equipment.filters import EquipmentFilterClass

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    rql_filter_class = EquipmentFilterClass
    permission_classes = [IsAuthenticated]


class DownTimePeriodViewSet(viewsets.ModelViewSet):
    queryset = DowntimePeriod.objects.all()
    serializer_class = DowntimePeriodSerializer
    permission_classes = [IsAuthenticated]