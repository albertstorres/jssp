from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from operations.models import Operation
from operations.serializers import OperationListSerializer, OperationCreateSerializer

class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return OperationCreateSerializer
        return OperationListSerializer