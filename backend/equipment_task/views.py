from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from equipment_task.serializers import EquipmentTaskSerializer
from equipment_task.models import EquipmentTask


class EquipmentTaskViewSet(viewsets.ModelViewSet):
    queryset = EquipmentTask.objects.all()
    serializer_class = EquipmentTaskSerializer
    permission_classes = [IsAuthenticated]