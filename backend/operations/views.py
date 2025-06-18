from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from operations.models import Operation
from operations.serializers import OpearionSerializer


class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.all()
    serializer_class = OpearionSerializer
    permission_classes = [IsAuthenticated]