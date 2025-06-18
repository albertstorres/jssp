from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from operation_task.serializers import OperationTaskSerializer
from operation_task.models import OperationTask
from operation_task.filters import OperationTaskFilterClass


class OperationTaskViewSet(viewsets.ModelViewSet):
    queryset = OperationTask.objects.all()
    serializer_class = OperationTaskSerializer
    rql_filter_class = OperationTaskFilterClass
    permission_classes = [IsAuthenticated]