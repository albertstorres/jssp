from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from equipment_operation.serializers import EquipmentOperationSerializer
from equipment_operation.models import EquipmentOperation


class EquipmentTaskViewSet(viewsets.ModelViewSet):
    queryset = EquipmentOperation.objects.all()
    serializer_class = EquipmentOperationSerializer
    permission_classes = [IsAuthenticated]
